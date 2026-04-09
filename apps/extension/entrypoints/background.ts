// Background service worker for the Odigo browser extension.
//
// Responsibilities:
//   - Restore and maintain the Socket.IO connection across browser restarts
//   - Track which URL the active tab is on and emit 'active_link' events
//     so the server can group users on the same page into a temporary room
//   - Store room and message data in local storage so the side panel can
//     read it after it opens
//   - Open the side panel when a room is accepted or when the toolbar icon
//     is clicked

import type { PublicMessage } from '@odigo/shared/lib/message';
import { restoreSession } from '../lib/session';
import { connectUser, getSocket } from '@odigo/shared/lib/socket';
import { storage } from 'wxt/utils/storage';
import { setHost } from '@odigo/shared/lib/handlers/host';

export default defineBackground(() => {

    // Tell the shared library where the Express server lives
    setHost(import.meta.env.WXT_EXPRESS_SERVER_HOST ?? 'http://localhost:8080');

    // Attempt to reconnect the socket using any previously saved session
    // so the background worker is ready as soon as the browser starts.
    (async () => {
        const session = await restoreSession();
        console.log('Session restored:', session ? 'yes' : 'no');
        if (session) {
            connectUser(session.access_token, () => {
                console.log('Socket connected');
            });
        }
    })();

    // --- Active tab URL tracking ---
    // We track the active tab's URL directly from the background using tab
    // events instead of injecting logic into every open tab via a content
    // script. This avoids running expensive code across all tabs simultaneously.

    /** URL schemes that should not trigger room matching */
    const IGNORED_SCHEMES = ['chrome://', 'about:', 'moz-extension://', 'chrome-extension://', 'edge://'];

    /**
     * Returns true if the URL represents a real web page we want to track.
     * Internal browser URLs and extension pages are excluded.
     *
     * @param url - The raw URL string to check
     */
    function isTrackableUrl(url: string): boolean {
        if (!url) return false;
        return !IGNORED_SCHEMES.some(scheme => url.startsWith(scheme));
    }

    /**
     * Emits an 'active_link' event to the server for the given URL.
     * If the server groups this socket with another user on the same URL,
     * it responds with 'room_accepted' and the side panel is opened with
     * the shared message history.
     *
     * Pending messages that arrive while waiting for room_accepted are
     * buffered and merged into the full history before storage.
     *
     * @param url - The URL of the currently active tab
     */
    async function handleActiveUrl(url: string) {
        if (!isTrackableUrl(url)) return;

        let socket;
        try {
            socket = getSocket();
        } catch {
            // No socket yet (user not logged in) -- nothing to do
            return;
        }

        console.log('Emitting active_link:', url);

        // Leave any room we were previously in before signaling a new URL
        socket.emit('leave_room');

        let pendingMessages: PublicMessage[] = [];

        // Buffer any messages that arrive before the room_accepted confirmation
        const messageHandler = (senderName: string, msg: string) => {
            pendingMessages.push({ senderName, message: msg, roomId: '' });
        };
        socket.on('message', messageHandler);

        socket.emit('active_link', url, false);

        // Safety timeout -- clean up listeners if the server never responds
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

            // Merge server history with messages that arrived mid-join
            const fullMessageHistory: PublicMessage[] = [...messageHistory, ...pendingMessages];
            pendingMessages = [];

            // Persist room data so the side panel can read it when it mounts
            await storage.setItem('local:roomId', id);
            await storage.setItem('local:messages', fullMessageHistory);

            // Open the side panel in the current window
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.windowId) {
                await browser.sidePanel.open({ windowId: tab.windowId });
            }

            // Wait for the side panel to mount before sending the message.
            // The 500 ms delay is a workaround for the panel not being ready
            // immediately after sidePanel.open() resolves.
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

    // Fires when a tab's URL changes -- covers both normal navigation and
    // SPA client-side routing (history.pushState / replaceState)
    browser.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
        if (!changeInfo.url) return;  // only care about URL changes, not status changes
        if (!tab.active) return;      // only care about the currently active tab
        await handleActiveUrl(changeInfo.url);
    });

    // --- Runtime message handler ---

    browser.runtime.onMessage.addListener(async (message) => {
        console.log('Message received:', message);

        if (message.type === 'ping') return true;

        // The side panel sends this after a successful login so the background
        // worker can connect its socket without requiring a browser restart.
        if (message.type === 'user_logged_in') {
            try {
                const socket = getSocket();
                if (socket?.connected) return;
            } catch {}
            const session = await restoreSession();
            if (session) connectUser(session.access_token, () => {});
        }
    });

    // Open the side panel when the toolbar icon is clicked
    browser.action.onClicked.addListener((tab) => {
        browser.sidePanel.open({ windowId: tab.windowId });
    });

    browser.runtime.onInstalled.addListener(() => {
        console.log('Extension installed');
    });
});
