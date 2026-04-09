// Shared Zod validation schemas used by both the client and the server.
// Keeping them here ensures the validation rules stay in sync across the
// entire monorepo.

import { z, ZodType } from 'zod';
import type { User } from './user';

//! Room and Message types are referenced below but never imported or defined
//! in this file.  These schemas will cause TypeScript errors at build time.

/** Validates a single User object coming from the API */
export const UserSchema: ZodType<User> = z.object({
    user_id: z.string(),
    username: z.string(),
});

/** Validates an array of User objects */
export const UserListSchema = z.array(UserSchema);

//! Room type is not defined or imported -- this will fail at compile time
export const RoomSchema: ZodType<Room> = z.object({
    room_name: z.string(),

});

/** Validates the body of a POST /api/rooms/create request */
export const CreateRoomRequestBodySchema = z.object({
    roomName: z.string().min(1).max(50),
    isPrivate: z.boolean(),
    //! isDm: z.boolean is a reference to the function, not a call.
    //! This should be z.boolean() (with parentheses) to produce a Zod schema.
    isDm: z.boolean,
    invitedUsers: UserListSchema
})

//! Message type is not defined or imported -- this will fail at compile time
export const MessageSchema: ZodType<Message> = z.object({
    user_id: z.string(),
    username: z.string(),
    socket_id: z.string(),
    jwt: z.string()
});

// Minimum lengths are defined as constants so they appear in error messages
// and can be updated in one place.
const usernameLength = 3;
const passwordLength = 8;

/**
 * Validates a login form submission.
 * Uses Zod v4's z.email() shorthand.
 */
export const LoginForm = z.object({
    email: z.email({error: 'Invalid email address'}),
    password: z.string().min(1, 'Password is required')
});

/**
 * Validates a registration form submission.
 * The refine() call enforces that password and confirmation match.
 * The error is attached to the confirmPassword path so the UI can highlight
 * the right field.
 */
export const RegisterForm = z.object({
    username: z.string().min(usernameLength, `Username must be at least ${usernameLength} characters`),
    email: z.email({error: 'Invalid email address'}),
    password: z.string().min(passwordLength, `Password must be at least ${passwordLength} characters`),
    confirmation: z.string()

}).refine((data) => data.password === data.confirmation, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Sets the error on the specific field
});
