/**
 * Represents an authenticated user throughout the application.
 *
 * The accessToken is optional because in most contexts (member lists,
 * message senders, etc.) only the identity fields are needed.  It is
 * populated when the object is constructed right after authentication.
 */
export interface User {
  /** Supabase JWT access token -- present only when freshly authenticated */
  accessToken?: string;
  /** Supabase user UUID */
  id: string;
  /** Display name chosen at registration */
  username: string;
}
