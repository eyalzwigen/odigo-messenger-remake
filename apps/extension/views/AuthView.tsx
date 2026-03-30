import { supabase } from "../lib/supabase";
import AuthForm from "@odigo/ui/components/forms/AuthForm";
import { handleLogin } from "@odigo/shared/lib/handlers/auth";
import { useEffect, useState } from "react";
import { saveSession } from "../lib/session";

export default function AuthView() {

    const LogingUser = async (formData: FormData) => {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const { access_token, refresh_token, error } = await handleLogin(email, password);
        
        if (!access_token) {
            alert(error);
            return;
        }

        await saveSession(access_token, refresh_token);
        
        // this triggers onAuthStateChange with SIGNED_IN
        await supabase.auth.setSession({ access_token, refresh_token });
    };

    return (
        <AuthForm mode='login' action={LogingUser}></AuthForm>
    )
}