'use client';

import { useEffect, useState, useRef } from "react";
import {socket, SendMessage} from '../lib/socket';

const Chat = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const userMessage = useRef<HTMLInputElement>(null);

    useEffect(() => {
        socket.on("message", (message: string) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('message');
        };
    }, []);

    const SendMessage = () => {
        if (!userMessage.current?.value) return;
        socket.emit("message", userMessage.current.value);
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