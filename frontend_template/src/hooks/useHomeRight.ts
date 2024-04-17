import { currChat } from "@/store/atom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { Socket } from "socket.io-client";

export interface MessageI {
    id: string;
    message: string;
    img?: string;
    senderId: string;
    receiverId: string;
    roomId: string;
    createdAt: Date;
}

export interface dataI {
    id: string;
    messages: MessageI;
}

export const useHomeRight = (socket: Socket) => {
    const chat = useRecoilValue(currChat);
    const [val, setVal] = useState<string>('');
    const [messages, setMessages] = useState<Array<MessageI>>([]);
    const [userId, setId] = useState<string>('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }

    const handleClick = useCallback(() => {
        try {
            if (!val) return;
            socket?.emit("sendingMsg", { val, chat });
            setVal("");
        } catch (err) {
            console.log(err);
        }
    }, [val, chat, socket])

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setVal(event.target.value);
    }, [])

    useEffect(() => {
        if (chat)
            socket?.emit('privateMessages', chat);
    }, [socket, chat])

    useEffect(() => {
        if (socket) {
            console.log("line 55")
            socket.on("receiveMessages", (data) => {
                console.log("line 56 inside receiving")
                setId(data.id)
                setMessages(data.messages)
            })

            socket.on("receiveMessage", (data: MessageI) => {
                let flag = true;
                for (let i = 0; i < messages.length; i++) {
                    if (messages[i].id === data.id) flag = false;
                }
                if (flag)
                    setMessages((prev) => [...prev, data])
            })
        }
    }, [socket])

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return { chat, messages, chatContainerRef, userId, val, handleChange, handleClick }
}