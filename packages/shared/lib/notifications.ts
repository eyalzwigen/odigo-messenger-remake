import { z } from "zod";
import type { User } from "./user";

// Mirrors the Prisma enum
export enum NotificationType {
  Unfriend = "Unfriend",
}

/**
 * A notification sent to a user.
 * user is optional because it is joined server-side --
 * the client only receives the id fields.
 */
export interface Notification {
  id: string;
  created_at: Date;
  read: boolean;

  type: NotificationType;
  data: Record<string, unknown>;

  user_id: string;
  user?: User;
}

/**
 * Zod schema for validating a Notification object (e.g. when received via API).
 * user is never in the incoming payload -- it is joined server-side after validation.
 */
export const NotificationValidator = z.object({
  id: z.string().uuid(),
  created_at: z.date(),
  read: z.boolean(),

  type: z.enum(["Unfriend"]),
  data: z.record(z.string(), z.unknown()),

  user_id: z.string().uuid(),
});

/** The validated shape of a notification as it comes from the client. */
export type NotificationInput = z.infer<typeof NotificationValidator>;
