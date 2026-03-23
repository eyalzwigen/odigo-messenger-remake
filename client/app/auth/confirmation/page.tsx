'use client'

import { useRouter } from "next/navigation";

export default function Confirmation () {

    const router = useRouter();

    const AccountConfirmed = () => {
        router.push('/auth/login');
    }

    return (
        <div>
            <h2>Please check your email to confirm your account</h2>
            <button onClick={AccountConfirmed}>I confirmed it</button>
        </div>
    );

}