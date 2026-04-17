"use client";

// Notification bell button displayed in the Navbar.
// Shows a badge with the unread count when count > 0.
// Caps the displayed number at 99+ to keep the badge from overflowing.

import { Bell } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";

interface Props {
  /** The number of unread notifications to display on the badge */
  count: number;
  /** Optional click handler, typically used to open a notifications panel */
  onClick?: () => void;
}

/**
 * An icon button with an optional red badge showing an unread count.
 * When count is 0, the badge is hidden entirely.
 * When count exceeds 99, the badge shows "99+" instead of the actual number.
 *
 * @param count - Number of unread notifications
 * @param onClick - Callback for when the bell is clicked
 */
export default function NotificationBell({ count, onClick }: Props) {
  const label = count > 99 ? "99+" : String(count);

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={onClick}>
      <Bell className="w-5 h-5 text-muted-foreground" />
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 py-0 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none border-2 border-background pointer-events-none">
          {label}
        </Badge>
      )}
    </Button>
  );
}
