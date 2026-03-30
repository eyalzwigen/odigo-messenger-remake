import type { PublicMessage } from '@odigo/shared/lib/message';
import { restoreSession } from '../lib/session';
import { connectUser, getSocket } from '@odigo/shared/lib/socket';
import { storage } from 'wxt/utils/storage';
import { setHost } from '@odigo/shared/lib/handlers/host';

export default defineBackground(() => {

    setHost(import.meta.env.WXT_EXPRESS_SERVER_HOST ?? 'http://localhost:8080');

    (async () => {
        const session = await restoreSession();
        console.log('Session restored:', session ? 'yes' : 'no');
        if (session) {
            connectUser(session.access_token, () => {
                console.log('Socket connected');
            });
        }
    })();

    browser.runtime.onMessage.addListener(async (message, sender) => {
        console.log('Message received:', message);

        if (message.type === 'ping') return true;

        // Only process active_link from the currently active tab
        if (message.type === 'active_link' && !sender.tab?.active) return;

        if (message.type === 'user_logged_in') {
            try {
                const socket = getSocket();
                if (socket?.connected) return;
            } catch {}
            const session = await restoreSession();
            if (session) connectUser(session.access_token, () => {});
        }

        if (message.type === 'active_link') {
            let socket;
            try {
                socket = getSocket();
            } catch {
                return;
            }
            
            console.log('Emitting active_link:', message.url);

            socket.emit('leave_room');

            let pendingMessages: PublicMessage[] = [];
            const messageHandler = (senderName: string, msg: string) => {
                pendingMessages.push({ senderName, message: msg, roomId: '' });
            };
            socket.on('message', messageHandler);

            socket.emit('active_link', message.url, false);

            socket.once('room_accepted', async (id: string, messageHistory: PublicMessage[]) => {
                console.log("Room Accepted!");
                socket.off('message', messageHandler);
                clearTimeout(timeout);

                const fullMessageHistory: PublicMessage[] = [...messageHistory, ...pendingMessages];
                pendingMessages = [];

                await storage.setItem('local:roomId', id);
                await storage.setItem('local:messages', fullMessageHistory);

                const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
                if (tab?.windowId) {
                    await browser.sidePanel.open({ windowId: tab.windowId });
                }

                // wait for sidepanel to load before sending message
                setTimeout(() => {
                    browser.runtime.sendMessage({
                        type: 'room_accepted',
                        roomId: id,
                        messageHistory: fullMessageHistory
                    }).catch(() => {});
                }, 500);
            });

            socket.once('room_error', () => {
                socket.off('message', messageHandler);
                socket.off('room_accepted');
                pendingMessages = [];
                clearTimeout(timeout);
                browser.runtime.sendMessage({ type: 'join_error', message: "Couldn't join room" });
            });
        }
    });

    browser.action.onClicked.addListener((tab) => {
        browser.sidePanel.open({ windowId: tab.windowId });
    });

    browser.runtime.onInstalled.addListener(() => {
        console.log('Extension installed');
    });
});