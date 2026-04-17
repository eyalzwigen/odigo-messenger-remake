"use client";

// Top navigation bar rendered on every page via the root layout.
// Displays the app name and a notification bell that shows incoming
// friend request counts.

import { useState } from "react";
import NotificationBell from "@odigo/ui/components/NotificationBell";

/**
 * The persistent top navigation bar.
 *
 * Currently manages the friend request notification count locally.
 * The socket listener for 'friend_request_received' and the notifications
 * panel are not yet implemented (see TODO below).
 */
export default function Navbar() {
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  // TODO: wire up socket listener for 'friend_request_received' here
  // and call setFriendRequestCount to drive the bell

  /**
   * Resets the unread friend request count when the bell is clicked.
   * Will also open the notifications panel once that is implemented.
   */
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
