'use client';

import { useEffect, useState, useRef } from "react";
import {getSocket, sendMessage} from '../lib/socket';

const Chat = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const userMessage = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getSocket().on("message", (message: string) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            getSocket().off('message');
        };
    }, []);

    const SendMessage = () => {
        if (!userMessage.current?.value) return;
        getSocket().emit("message", userMessage.current.value);
        userMessage.current.value = "";
    };

    return (
    <div>
        <ul id="messages">
            {messages.map((msg, i) => (
                <li key={i}>{msg}</li>
            ))}
        </ul>
        <input placeholder="message" ref={userMessage}></input>
        <button onClick={SendMessage}>Send</button>
    </div>
    );
}

export default Chat;