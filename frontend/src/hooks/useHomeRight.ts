// Cleaned up legacy code


import { dataI, MessageI } from "@mangalam0049k/common";
import { currChat } from "@/store/atom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { Socket } from "socket.io-client";

// Module-level Set to track which message IDs have triggered AI generation
// This is shared across ALL instances of the hook to prevent duplicate requests
// when both HomeRight and MobileHomeRight are mounted
const aiRequestedForMessages = new Set<string>();

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

    // Clean message sending - no local display
    const handleClick = useCallback(() => {
        try {
            if (!val.trim()) return;

            console.log("Sending message to server:", val);

            // Just emit to server - let server broadcast handle ALL displays
            socket?.emit("sendingMsg", { val, chat });

            // Clear input immediately for better UX
            setVal("");

        } catch (err) {
            console.log("Error sending message:", err);
        }
    }, [val, chat, socket]);

    const handleChatsWithAI = useCallback(() => {
        try {
            if (!val.trim()) return;

            console.log("Chatting with AI:", val);
            socket?.emit("sendingMsgToAI", { val, chat });
            setVal("");

        } catch (err) {
            console.log("Error chatting with AI:", err);
        }
    }, [chat, socket, val]);

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setVal(event.target.value);
    }, []);

    // Load chat history when chat changes
    useEffect(() => {
        if (chat) {
            socket?.emit('privateMessages', chat);
        }
    }, [socket, chat]);

    useEffect(() => {
        if (!socket) return;

        // Handler for initial message load
        const handleReceiveMessages = (data: dataI) => {
            console.log("Loading chat history:", data.messages.length, "messages");
            setId(data.id);
            setMessages(data.messages);
        };

        // Handler for new regular messages (including your own)
        const handleReceiveMessage = (data: MessageI) => {
            console.log("Received new message:", data);

            setMessages((prevMessages) => {
                // Improved duplicate check
                const isDuplicate = prevMessages.some((msg) =>
                    msg.id === data.id ||
                    (msg.message === data.message && msg.senderId === data.senderId &&
                        Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 1000)
                );

                if (isDuplicate) {
                    console.log("Duplicate message detected, skipping");
                    return prevMessages;
                }

                return [...prevMessages, data];
            });
        };

        // Handler for AI messages (user's message sent to AI)
        const handleReceiveMessageAI = (data: MessageI) => {
            console.log("Received AI message:", data);

            setMessages((prevMessages) => {
                const isDuplicate = prevMessages.some((msg) => msg.id === data.id);
                if (isDuplicate) {
                    return prevMessages;
                }
                return [...prevMessages, data];
            });

            // Generate AI response only once per message
            // Check if we've already requested AI for this message ID
            if (!aiRequestedForMessages.has(data.id)) {
                aiRequestedForMessages.add(data.id);
                socket?.emit("generatingResponseFromAI", { val: data.message, chat });
            } else {
                console.log("AI already requested for message:", data.id);
            }
        };

        // Handler for deleted messages
        const handleDeletedMessage = (messageId: string) => {
            console.log("Message deleted:", messageId);
            setMessages((prevMessages) => prevMessages.filter((el) => el.id !== messageId));
        };

        // Register event listeners
        socket.on("receiveMessages", handleReceiveMessages);
        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("receiveMessageAI", handleReceiveMessageAI);
        socket.on("DeletedMessage", handleDeletedMessage);

        // Cleanup function
        return () => {
            socket.off("receiveMessages", handleReceiveMessages);
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("receiveMessageAI", handleReceiveMessageAI);
            socket.off("DeletedMessage", handleDeletedMessage);
        };
    }, [socket, chat]);

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return {
        chat,
        messages,
        chatContainerRef,
        userId,
        val,
        handleChange,
        handleClick,
        handleChatsWithAI
    };
}