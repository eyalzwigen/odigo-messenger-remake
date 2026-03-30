'use client'
import { createClient } from "@/lib/supabase/client";
import AuthForm from "@odigo/ui/components/forms/AuthForm";
import { useRouter } from "next/navigation";
import { handleLogin } from "@odigo/shared/lib/handlers/auth";
import { useEffect, useState } from "react";
export default function Login() {
    const router = useRouter();

    const LogingUser = async (formData: FormData) => {
        const email: string = formData.get('email') as string;
        const password: string = formData.get('password') as string;

        const {access_token, refresh_token, error} = await handleLogin(email, password);
        if (!access_token) {
            //TODO: Implement a better error reporting mechanic (Best way is to put the error in the actual form (Like the danger thing from Bootstrap but in the actual form))
            alert(error);
        } else {
            createClient().auth.setSession({
                access_token,
                refresh_token
            });

            router.push('/rooms');
        }
    }

    return (
        <AuthForm mode='login' action={LogingUser}></AuthForm>
    )
}