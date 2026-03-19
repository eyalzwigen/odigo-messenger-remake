import { z, ZodType } from 'zod';
import type { User } from '../../../shared/lib/user.js';
import type { Room } from '../../../shared/lib/room.js';
import type { Message } from '../../../shared/lib/message.js';

export const UserSchema: ZodType<User> = z.object({
    user_id: z.string(),
    username: z.string(),
});

export const UserListSchema = z.array(UserSchema);

export const RoomSchema: ZodType<Room> = z.object({
    room_name: z.string(),

});

export const CreateRoomRequestBodySchema = z.object({
    roomName: z.string().min(1).max(50),
    isPrivate: z.boolean(),
    isDm: z.boolean, 
    invitedUsers: UserListSchema
})
export const MessageSchema: ZodType<Message> = z.object({
    user_id: z.string(),
    username: z.string(),
    socket_id: z.string(),
    jwt: z.string()
});

const usernameLength = 3;
const passwordLength = 8;

export const LoginForm = z.object({
    email: z.email({error: 'Invalid email address'}),
    password: z.string().min(1, 'Password is required')
});

export const RegisterForm = z.object({
    username: z.string().min(usernameLength, `Username must be at least ${usernameLength} characters`),
    email: z.email({error: 'Invalid email address'}),
    password: z.string().min(passwordLength, `Password must be at least ${passwordLength} characters`),
    confirmation: z.string()

}).refine((data) => data.password === data.confirmation, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Sets the error on the specific field
});