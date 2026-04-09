// Authentication view shown in the extension side panel when the user is
// not logged in.  Reuses the shared AuthForm component in login mode.

import { supabase } from "../lib/supabase";
import AuthForm from "@odigo/ui/components/forms/AuthForm";
import { handleLogin } from "@odigo/shared/lib/handlers/auth";
import { useEffect, useState } from "react";
import { saveSession } from "../lib/session";

/**
 * Login form for the browser extension side panel.
 *
 * On successful login, persists the tokens to extension local storage and
 * hydrates the Supabase client so onAuthStateChange fires in SessionContext,
 * which then connects the socket and re-renders the panel with the chat view.
 */
export default function AuthView() {

    /**
     * Called by AuthForm with the submitted form data.
     * Delegates to the shared login handler and, on success, saves the tokens
     * and calls supabase.auth.setSession to trigger the auth state listener.
     *
     * @param formData - FormData from the login HTML form
     */
    const LogingUser = async (formData: FormData) => {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const { access_token, refresh_token, error } = await handleLogin(email, password);

        if (!access_token) {
            alert(error);
            return;
        }

        // Persist tokens so the background service worker and future panel
        // opens can restore the session without logging in again
        await saveSession(access_token, refresh_token);

        // this triggers onAuthStateChange with SIGNED_IN
        await supabase.auth.setSession({ access_token, refresh_token });
    };

    return (
        <AuthForm mode='login' action={LogingUser}></AuthForm>
    )
}
