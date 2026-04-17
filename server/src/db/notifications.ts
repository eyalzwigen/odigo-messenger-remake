// Database helpers for the notification system.
// All functions talk to Prisma and return plain objects (not Prisma model
// instances) so callers don't depend on generated Prisma types.

import type {
  FriendRequestInput,
  Friendship,
} from "../../../packages/shared/lib/friends.js";
import type { NotificationInput } from "../../../packages/shared/lib/notifications.js";
import prisma from "./index.js";

export async function createNotification(
  userId: string,
  type: string,
  data: Record<string, string>,
): Promise<NotificationInput> {
  const res = await prisma.notification.create();
}

export async function getNotification(id: string): Promise<NotificationInput> {}

export async function deleteNotification(
  id: string,
): Promise<NotificationInput> {}
