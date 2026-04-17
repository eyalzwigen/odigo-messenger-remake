"use client";

// Registration page for the web client.
// Renders the shared AuthForm in register mode and handles the form submission.

import AuthForm from "@odigo/ui/components/forms/AuthForm";
import { useRouter } from "next/navigation";
import { handleRegisteration } from "@odigo/shared/lib/handlers/auth";

/**
 * The /auth/register page.
 * Submits the registration form to the Express API and, on success,
 * redirects to the email confirmation page.
 */
export default function Login() {
  const router = useRouter();

  /**
   * Called by the AuthForm with the submitted form data.
   * Extracts all fields and delegates to the shared registration handler.
   * Navigates to /auth/confirmation on success so the user knows to check
   * their email.
   *
   * @param formData - The FormData object from the HTML form submission
   */
  const RegisterUser = async (formData: FormData) => {
    const userName: string = formData.get("username") as string;
    const email: string = formData.get("email") as string;
    const password: string = formData.get("password") as string;
    const confirmation: string = formData.get("confirmation") as string;

    const error = await handleRegisteration(
      userName,
      email,
      password,
      confirmation,
    );
    if (error) {
      //TODO: Implement a better error reporting mechanic (Best way is to put the error in the actual form (Like the danger thing from Bootstrap but in the actual form))
      alert(error);
    } else {
      router.push("/auth/confirmation");
    }
  };

  return <AuthForm mode="register" action={RegisterUser}></AuthForm>;
}
