'use client';

import { useEffect, useState, useRef } from "react";
import { sendMessage } from '../../lib/socket';
import type { PublicMessage } from '../../../shared/lib/message';
import styles from './Chat.module.css';
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/SessionContext";
import { Socket } from "socket.io-client";

export type ChatData = {
    roomId: string,
    pastMessages: PublicMessage[]
}

const PublicChat = ({roomId, pastMessages}: ChatData) => {
    const [messages, setMessages] = useState<PublicMessage[]>([]);
    const userMessage = useRef<HTMLTextAreaElement>(null);
    const lastMessageRef = useRef<HTMLLIElement>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    const socket: Socket = useSocket()!;
    const router = useRouter();

    useEffect(() => {
        setMessages(pastMessages);
        console.log(pastMessages);
        setLoaded(true);
    }, [pastMessages]);

    useEffect(() => {
        socket.on('message', (senderName: string, message: string) => {

            const newMessage: PublicMessage = {
                senderName: senderName,
                message: message,
                roomId: roomId
            }

            setMessages(prev => [...prev, newMessage]);
        });

        socket.on('room_deleted', (roomId: string) => {
            router.push('/rooms/public');
        });

        return () => {
            socket.off('message');
        };

    }, [roomId]);

    useEffect(() => {
        lastMessageRef.current?.scrollIntoView();
    }, [messages]);

    const SendMessage = () => {
        if (!userMessage.current?.value) return;
        sendMessage(
            socket, 
            {
            roomId: roomId, 
            message: userMessage.current.value
        });
        userMessage.current.value = "";
    };

    return (
    <div className={styles.forum}>
        <div className={styles.messages}>
            <ul>
                {messages.map((msg, i) => (
                    <li key={i} ref={i === messages.length - 1 ? lastMessageRef : null} >
                        
                        <label>
                            <label className={styles.sender_name}>{msg.senderName}: </label>
                            <label>{msg.message}</label>
                        </label>
                        {/* //* Maybe: <hr/> */}
                    </li>
                ))}
            </ul>
        </div>
        <div>
            <form onSubmit={(e) => { e.preventDefault(); SendMessage(); }} className={styles.compose}>
                <textarea placeholder="message" ref={userMessage}></textarea>
                <input type="submit" value="Send"></input>
            </form>
        </div>
    </div>
    );
}

export default PublicChat;