'use client';

import { useEffect, useState, useRef } from "react";
import { sendMessage } from '@odigo/shared/lib/socket';
import type { PublicMessage } from '@odigo/shared/lib/message';
import { Socket } from "socket.io-client";
import { ScrollArea } from "../scroll-area";
import { Button } from "../button";
import { Card } from "../card";
import { Textarea } from "../textarea";
import { Plus, Send, Smile, Zap } from "lucide-react"

export type ChatData = {
    roomId: string,
    pastMessages: PublicMessage[],
    onRoomDeleted: () => void,
    socket: Socket
}

const PublicChat = ({roomId, pastMessages, onRoomDeleted, socket}: ChatData) => {
    const [messages, setMessages] = useState<PublicMessage[]>([]);
    const userMessage = useRef<HTMLTextAreaElement>(null);
    const lastMessageRef = useRef<HTMLLIElement>(null);
    const [loaded, setLoaded] = useState<boolean>(false);


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
            onRoomDeleted()
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
    <div className="flex h-screen flex-col overflow-hidden p-2.5">
        <ScrollArea className="grow">
            <ul>
                {messages.map((msg, i) => (
                    <li key={i} ref={i === messages.length - 1 ? lastMessageRef : null} >
                        
                        <span>
                            <span className="text-blue-700 font-bold">{msg.senderName}: </span>
                            <span>{msg.message}</span>
                        </span>
                        {/* //* Maybe: <hr/> */}
                    </li>
                ))}
            </ul>
        </ScrollArea>
        <form 
            onSubmit={(e) => { e.preventDefault(); SendMessage(); }} 
            className="flex items-center gap-3 mx-4 mb-6 px-4 py-2.5 bg-input rounded-lg border border-transparent focus-within:border-ring transition-colors"
        >
            <button type="button" className="shrink-0 text-[#b5bac1] hover:text-white transition-colors">
                <Plus size={18} />
            </button>

            <Textarea
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        SendMessage();
                    }
                }}
                onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = `${t.scrollHeight}px`;
                }}
                className="flex-1 min-h-[40px] max-h-[50vh] resize-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 py-2 text-[#b5bac1] placeholder:text-[#6d6f78] text-sm leading-relaxed"
                placeholder={`Message #${roomId}`}
                ref={userMessage}
                rows={1}
            />

            <div className="flex items-center gap-2 shrink-0">
                <button type="button" className="text-[#b5bac1] hover:text-white transition-colors">
                    <Zap size={18} />
                </button>
                <button type="button" className="text-[#b5bac1] hover:text-white transition-colors">
                    <Smile size={18} />
                </button>
            </div>
        </form>
    </div>
    );
}

export default PublicChat;