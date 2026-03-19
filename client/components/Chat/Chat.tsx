'use client';

import { useEffect, useState, useRef } from "react";
import {getSocket, sendMessage} from '../../lib/socket';
import type { Message } from '../../../shared/lib/message';
import styles from './Chat.module.css';

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const userMessage = useRef<HTMLTextAreaElement>(null);

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
    <div className={styles.forum}>
        <div className={styles.messages}>
            <ul>
                {messages.map((msg, i) => (
                    <li key={i}>
                        <label>
                            <label className={styles.sender_name}>{msg.sender_name}: </label>
                            <label>{msg.message}</label>
                        </label>
                        {/* //* Maybe: <hr></hr> */}
                    </li>
                ))}
            </ul>
        </div>
        <div>
            <form action={SendMessage} className={styles.compose}>
                <textarea placeholder="message" ref={userMessage}></textarea>
                <input type="submit" value="Send"></input>
            </form>
        </div>
    </div>
    );
}

export default Chat;