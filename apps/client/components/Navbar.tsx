'use client';

import { useState } from 'react';
import NotificationBell from '@odigo/ui/components/NotificationBell';

export default function Navbar() {
    const [friendRequestCount, setFriendRequestCount] = useState(0);

    // TODO: wire up socket listener for 'friend_request_received' here
    // and call setFriendRequestCount to drive the bell

    const handleBellClick = () => {
        setFriendRequestCount(0);
        // TODO: open notifications panel
    };

    return (
        <nav className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
            <span className="font-semibold text-sm tracking-tight">Odigo</span>
            <NotificationBell count={friendRequestCount} onClick={handleBellClick} />
        </nav>
    );
}
