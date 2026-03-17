'use client';

import { useEffect, useState, useRef } from "react";
import {getSocket, sendMessage} from '../../lib/socket';
import type { Message } from '../../../shared/lib/message';
import styles from './Chat.module.css';

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const userMessage = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getSocket().on("message", (sender_name: string, message: string) => {
            const newMessage: Message = {
                sender_name: sender_name,
                message: message
            }
            setMessages(prev => [...prev, newMessage]);
        });

        return () => {
            getSocket().off('message');
        };
    }, []);

    const SendMessage = () => {
        if (!userMessage.current?.value) return;
        sendMessage(userMessage.current.value);
        userMessage.current.value = "";
    };

    return (
    <div>
        <ul id="messages">
            {messages.map((msg, i) => (
                <li key={i}>
                    <p><label className={styles.sender_name}>{msg.sender_name}: </label>{msg.message}</p>
                </li>
            ))}
        </ul>
        <input placeholder="message" ref={userMessage}></input>
        <button onClick={SendMessage}>Send</button>
    </div>
    );
}

export default Chat;