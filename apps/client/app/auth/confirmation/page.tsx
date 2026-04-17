"use client";

// Email confirmation holding page.
// Shown after registration while the user is waiting for the Supabase
// confirmation email.  Provides a button to navigate to login once confirmed.

import { useRouter } from "next/navigation";

/**
 * The /auth/confirmation page.
 * Displays a prompt telling the user to check their email.
 * The "I confirmed it" button navigates to the login page.
 */
export default function Confirmation() {
  const router = useRouter();

  /** Navigates back to the login page after the user confirms their email */
  const AccountConfirmed = () => {
    router.push("/auth/login");
  };

  return (
    <div>
      <h2>Please check your email to confirm your account</h2>
      <button onClick={AccountConfirmed}>I confirmed it</button>
    </div>
  );
}
