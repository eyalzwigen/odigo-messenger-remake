"use client";

// Login page for the web client.
// Renders the shared AuthForm in login mode and handles the form submission.

import { createClient } from "@/lib/supabase/client";
import AuthForm from "@odigo/ui/components/forms/AuthForm";
import { useRouter } from "next/navigation";
import { handleLogin } from "@odigo/shared/lib/handlers/auth";
import { useEffect, useState } from "react";

/**
 * The /auth/login page.
 * Submits credentials to the Express auth endpoint, then stores the returned
 * tokens in Supabase's browser session.  On success, navigates to /rooms.
 */
export default function Login() {
  const router = useRouter();

  /**
   * Called by the AuthForm with the submitted form data.
   * Extracts email and password, calls the login handler, and on success
   * sets the Supabase client session before redirecting.
   *
   * @param formData - The FormData object from the HTML form submission
   */
  const LogingUser = async (formData: FormData) => {
    const email: string = formData.get("email") as string;
    const password: string = formData.get("password") as string;

    const { access_token, refresh_token, error } = await handleLogin(
      email,
      password,
    );
    if (!access_token) {
      //TODO: Implement a better error reporting mechanic (Best way is to put the error in the actual form (Like the danger thing from Bootstrap but in the actual form))
      alert(error);
    } else {
      // Hydrate the browser Supabase client with the tokens received
      // from the Express API so onAuthStateChange fires
      createClient().auth.setSession({
        access_token,
        refresh_token,
      });

      router.push("/rooms");
    }
  };

  return <AuthForm mode="login" action={LogingUser}></AuthForm>;
}
