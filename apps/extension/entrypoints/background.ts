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

    // ── Active tab URL tracking ─────────────────────────────────────────────
    // We track the active tab's URL directly from the background using tab
    // events instead of injecting logic into every open tab via a content
    // script. This avoids running expensive code across all tabs simultaneously.

    const IGNORED_SCHEMES = ['chrome://', 'about:', 'moz-extension://', 'chrome-extension://', 'edge://'];

    function isTrackableUrl(url: string): boolean {
        if (!url) return false;
        return !IGNORED_SCHEMES.some(scheme => url.startsWith(scheme));
    }

    async function handleActiveUrl(url: string) {
        if (!isTrackableUrl(url)) return;

        let socket;
        try {
            socket = getSocket();
        } catch {
            return;
        }

        console.log('Emitting active_link:', url);

        socket.emit('leave_room');

        let pendingMessages: PublicMessage[] = [];
        const messageHandler = (senderName: string, msg: string) => {
            pendingMessages.push({ senderName, message: msg, roomId: '' });
        };
        socket.on('message', messageHandler);

        socket.emit('active_link', url, false);

        // Safety timeout — clean up listeners if the server never responds
        const timeout = setTimeout(() => {
            socket.off('message', messageHandler);
            socket.off('room_accepted');
            socket.off('room_error');
            pendingMessages = [];
        }, 10_000);

        socket.once('room_accepted', async (id: string, messageHistory: PublicMessage[]) => {
            console.log('Room accepted:', id);
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

            // Wait for the side panel to mount before sending the message
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
            browser.runtime.sendMessage({ type: 'join_error', message: "Couldn't join room" }).catch(() => {});
        });
    }

    // Fires when the user switches tabs
    browser.tabs.onActivated.addListener(async (activeInfo) => {
        try {
            const tab = await browser.tabs.get(activeInfo.tabId);
            if (tab.url) await handleActiveUrl(tab.url);
        } catch {}
    });

    // Fires when a tab's URL changes — covers both normal navigation and
    // SPA client-side routing (history.pushState / replaceState)
    browser.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
        if (!changeInfo.url) return;  // only care about URL changes, not status changes
        if (!tab.active) return;      // only care about the currently active tab
        await handleActiveUrl(changeInfo.url);
    });

    // ── Runtime message handler ─────────────────────────────────────────────

    browser.runtime.onMessage.addListener(async (message) => {
        console.log('Message received:', message);

        if (message.type === 'ping') return true;

        if (message.type === 'user_logged_in') {
            try {
                const socket = getSocket();
                if (socket?.connected) return;
            } catch {}
            const session = await restoreSession();
            if (session) connectUser(session.access_token, () => {});
        }
    });

    browser.action.onClicked.addListener((tab) => {
        browser.sidePanel.open({ windowId: tab.windowId });
    });

    browser.runtime.onInstalled.addListener(() => {
        console.log('Extension installed');
    });
});
