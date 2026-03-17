'use client';

import { useRef } from 'react';
import Chat from '../components/Chat';
import { connectUser } from '../lib/socket'


export default function Home() {
  const usernameInput = useRef<HTMLInputElement>(null)
  const Authenticate = () => {
    if (!usernameInput.current?.value) return;
    connectUser(usernameInput.current.value);
  }

  return (
    <div>    
      <h1>Welcome to Messenger!</h1>
      <label htmlFor="username">Enter A Username</label>
      <input name="username" placeholder="Username..." ref={usernameInput}></input>
      <button>Start Chatting</button>
    </div>
  );
};