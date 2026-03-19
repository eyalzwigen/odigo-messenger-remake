'use client'
import { createClient } from "@/lib/supabase/client";
import AuthForm from "@/components/forms/AuthForm";
import { useRouter } from "next/navigation";
import { handleRegisteration } from "@/lib/handlers/auth";

export default function Login() {

    const router = useRouter();

    const RegisterUser = async (formData: FormData) => {
        const userName: string = formData.get('username') as string;
        const email: string = formData.get('email') as string;
        const password: string = formData.get('password') as string;
        const confirmation: string = formData.get('confirmation') as string;

        const error = await handleRegisteration(userName, email, password, confirmation);
        if (error) {
            //TODO: Implement a better error reporting mechanic (Best way is to put the error in the actual form (Like the danger thing from Bootstrap but in the actual form))
            alert(error);
        } else {
            router.push('/auth/confirmation');
        }
    }

    return (
        <AuthForm mode='register' action={RegisterUser}></AuthForm>
    )
}