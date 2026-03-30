'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { connectUser } from '@odigo/shared/lib/socket'
import { useSession } from '@/lib/SessionContext';
import { Button } from '@odigo/ui/components/button';


export default function Home() {
  const usernameInput = useRef<HTMLInputElement>(null)
  const router = useRouter();
  const session = useSession();

  const Start = () => {

    connectUser(session?.access_token!, () => {
      router.push('/rooms/public');
    });
  }

  return (
    <div>    
      <h1>Welcome to Messenger!</h1>
      <Button onClick={Start}>Start Chatting!</Button>
    </div>
  );
};