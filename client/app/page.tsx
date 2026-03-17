'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Chat from '../components/Chat/Chat';
import { connectUser } from '../lib/socket'


export default function Home() {
  const usernameInput = useRef<HTMLInputElement>(null)
  const router = useRouter();

  const Authenticate = () => {
    if (!usernameInput.current?.value) return;

    const socket = connectUser(usernameInput.current.value, () => {
      router.push('/chat');
    });
  }

  return (
    <div>    
      <h1>Welcome to Messenger!</h1>
      <label htmlFor="username">Enter A Username</label>
      <input name="username" placeholder="Username..." ref={usernameInput}></input>
      <button onClick={Authenticate}>Start Chatting</button>
    </div>
  );
};