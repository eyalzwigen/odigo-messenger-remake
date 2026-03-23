'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { connectUser } from '../lib/socket'
import { useSession } from '@/lib/SessionContext';


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
      <button onClick={Start}>Start Chatting!</button>
    </div>
  );
};