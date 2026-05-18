// Database helpers for the notification system.
// All functions talk to Prisma and return plain objects (not Prisma model
// instances) so callers don't depend on generated Prisma types.

import { da, id } from "zod/locales";
import type {
  FriendRequestInput,
  Friendship,
} from "../../../packages/shared/lib/friends.js";
import type { NotificationInput } from "../../../packages/shared/lib/notifications.js";
import type { NotificationType } from "../generated/prisma/enums.js";
import prisma from "./index.js";

export function parseResponse(res: any): NotificationInput | null {
  if (!res) return null;

  const notification = {
    id: res.id,
    created_at: res.created_at,
    read: res.read,

    type: res.type,
    data: res.data as Record<string, string>,

    user_id: res.user_id,
    user: res.user,

  }

  return notification;
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, string>,
): Promise<NotificationInput | null> {
  const res = await prisma.notification.create({
    data: {
        type: type,
        user_id: userId,
        data: data
    },
    include: {
        user: true
    }
  });

  return parseResponse(res);
}

export async function getNotification(id: string): Promise<NotificationInput | null> {
  const res = await prisma.notification.findUnique({
    where: {
      id: id
    },
    include: {
      user: true
    }
  });

  return parseResponse(res);
}

export async function deleteNotification(
  id: string,
): Promise<NotificationInput | null> {
  const res = await prisma.notification.delete({
    where: {
      id: id
    },
    include: {
      user: true
    }
  });

  return parseResponse(res);
}
