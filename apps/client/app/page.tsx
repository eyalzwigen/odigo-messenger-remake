"use client";

// Home / landing page for authenticated users.
// Prompts the user to connect their socket and navigate to the public rooms list.

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { connectUser } from "@odigo/shared/lib/socket";
import { useSession } from "@/lib/SessionContext";
import { Button } from "@odigo/ui/components/button";

/**
 * The main landing page shown after login.
 * The "Start Chatting!" button connects the user's socket and redirects to
 * the public rooms browser.
 */
export default function Home() {
  const usernameInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const session = useSession();

  /**
   * Initiates the socket connection and navigates to the rooms list.
   * The session access token is used to authenticate the socket handshake.
   */
  const Start = () => {
    connectUser(session?.access_token!, () => {
      router.push("/rooms/public");
    });
  };

  return (
    <div>
      <h1>Welcome to Messenger!</h1>
      <Button onClick={Start}>Start Chatting!</Button>
    </div>
  );
}
