// Reusable authentication form used for both login and registration.
// Renders different fields based on the mode prop and adapts its heading
// and footer link accordingly.

import { Button } from "@odigo/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@odigo/ui/components/card";
import { Input } from "@odigo/ui/components/input";
import { Label } from "@odigo/ui/components/label";

/** Controls which variant of the form is rendered */
type AuthMode = {
  /** 'login' shows email + password; 'register' also shows username + confirmation */
  mode: "login" | "register";
  /** Called with the FormData when the form is submitted */
  action: (formData: FormData) => void;
};

/**
 * A centered card containing a login or registration form.
 *
 * The form uses a native HTML action (not onSubmit) so it works with both
 * Next.js Server Actions and client-side handlers.
 *
 * @param mode - 'login' or 'register'
 * @param action - The form submit handler
 */
const AuthForm = ({ mode, action }: AuthMode) => {
  // The button label and card title are derived from mode
  const HeaderButtonText = mode === "login" ? "Login" : "Register";

  // Link at the bottom that lets users switch between login and register
  const SwitchModeText =
    mode === "login" ? (
      <a href="/auth/register">Create a New Account</a>
    ) : (
      <a href="/auth/login">I Already Have an Account</a>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{HeaderButtonText}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={action} className="flex flex-col gap-4">
            {/* Username field is only shown in register mode */}
            {mode === "register" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input type="text" name="username" id="username" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" name="email" id="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input type="password" name="password" id="password" />
            </div>
            {/* Password confirmation field is only shown in register mode */}
            {mode === "register" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmation">Confirm Password</Label>
                <Input type="password" name="confirmation" id="confirmation" />
              </div>
            )}
            <Button type="submit" className="w-full">
              {HeaderButtonText}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">{SwitchModeText}</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthForm;
