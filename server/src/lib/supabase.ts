// Exports a server-side Supabase admin client and the requireAuth middleware.
// The admin client uses the service role key so it can verify tokens and
// query user data without the row-level security restrictions that apply to
// the anon key.

import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

// This client has elevated permissions (service role).
// Never expose it to the browser or include it in client-side code.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

/**
 * Makes sure that the user is authenticated before continuing to the API call
 *
 * @remarks
 * Checks if the request has the user's JWT token, and if there is
 * a user in the database that is associated with that token
 *
 * @param req - The POST request
 * @param res - The POST response
 * @param next - A callback function
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Expect "Authorization: Bearer <token>" in the request headers
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Authorization token needed!" });
    return;
  }

  // Verify the JWT against Supabase and retrieve the associated user
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    res.status(401).json({ error: "Invalid Authorization Token!" });
    return;
  }

  // Attach the verified user to the request so downstream handlers can
  // read it without hitting the database again (see server/src/types/express.d.ts)
  req.user = data.user;
  next();
}

export default supabase;
