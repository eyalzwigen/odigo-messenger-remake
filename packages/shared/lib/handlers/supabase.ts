/**
 * Builds the HTTP headers required for authenticated requests to the
 * Express API.
 *
 * @param token - The Supabase JWT access token for the current user
 * @returns A headers object with Content-Type and Authorization set
 * @throws {Error} If no token is provided (user is not authenticated)
 */
export async function getAuthHeaders(token: string) {
  if (!token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
