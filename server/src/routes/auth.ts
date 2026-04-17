// Express router for authentication endpoints.
// All routes delegate to Supabase Auth using the service-role admin client
// passed in at startup.  No JWT tokens are issued here directly -- Supabase
// handles that and we forward only what the client needs.

import { Router } from "express";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import {
  LoginForm,
  RegisterForm,
} from "../../../packages/shared/lib/zodSchemas.js";

/**
 * Builds and returns the auth router.
 *
 * @param supabase - The admin Supabase client (initialized with service role key)
 * @returns An Express Router with /login and /register POST handlers
 */
export default function authRouter(supabase: SupabaseClient) {
  const router = Router();

  /**
   * Extracts only the tokens from a Supabase session so we never leak
   * unneeded user data to the client.
   */
  const sessionResponse = (session: Session) => ({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  /**
   * POST /api/auth/login
   *
   * Validates the request body, signs the user in via Supabase, and returns
   * a short-lived access token and a refresh token.
   *
   * Body: { email: string, password: string }
   * Success: 200 { access_token, refresh_token }
   * Failure: 400 (validation) | 401 (bad credentials)
   */
  router.post("/login", async (req, res): Promise<void> => {
    const result = LoginForm.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: req.body.email,
      password: req.body.password,
    });

    if (error) {
      res.status(error.status ?? 401).json({ error: error.message });
      return;
    }

    res.status(200).json(sessionResponse(data.session));
  });

  /**
   * POST /api/auth/register
   *
   * Validates the request body and creates a new Supabase account.
   * The username is stored as user metadata so it is accessible on
   * session objects later.  Supabase will send a confirmation email --
   * the account is not active until confirmed.
   *
   * Body: { username: string, email: string, password: string, confirmation: string }
   * Success: 200 { error: null }
   * Failure: 400 (validation) | 401 (Supabase error)
   */
  router.post("/register", async (req, res): Promise<void> => {
    const result = RegisterForm.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: req.body.email,
      password: req.body.password,
      options: {
        data: { username: req.body.username },
      },
    });

    if (error) {
      res.status(error.status ?? 401).json({ error: error.message });
      return;
    }

    res.status(200).json({ error: null });
  });

  return router;
}
