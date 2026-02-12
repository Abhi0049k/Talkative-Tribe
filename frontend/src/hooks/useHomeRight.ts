// Cleaned up legacy code


import { dataI, MessageI } from "@mangalam0049k/common";
import { currChat } from "@/store/atom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { Socket } from "socket.io-client";

// Module-level Set to track which message IDs have triggered AI generation
const aiRequestedForMessages = new Set<string>();

export const useHomeRight = (socket: Socket) => {
    const chat = useRecoilValue(currChat);
    const [val, setVal] = useState<string>('');
    const [messages, setMessages] = useState<Array<MessageI>>([]);
    const [userId, setId] = useState<string>('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const isCommunity = useMemo(() => !!(chat && !chat.includes("-#=#-")), [chat]);

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

            if (isCommunity) {
                socket?.emit("sendCommunityMessage", { communityId: chat, message: val, image: null });
            } else {
                // Just emit to server - let server broadcast handle ALL displays
                socket?.emit("sendingMsg", { val, chat });
            }

            // Clear input immediately for better UX
            setVal("");

        } catch (err) {
            console.log("Error sending message:", err);
        }
    }, [val, chat, socket, isCommunity]);

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
            if (isCommunity) {
                socket?.emit("joinCommunityRoom", { communityId: chat });
                socket?.emit('getCommunityMessages', chat);
            } else {
                socket?.emit('privateMessages', chat);
            }
        }

        return () => {
            if (isCommunity && chat) {
                socket?.emit("leaveCommunityRoom", { communityId: chat });
            }
        }
    }, [socket, chat, isCommunity]);

    useEffect(() => {
        if (!socket) return;

        // Handler for initial message load
        const handleReceiveMessages = (data: dataI) => {
            console.log("Loading chat history:", data.messages.length, "messages");
            setId(data.id);
            setMessages(data.messages);
        };

        const handleReceiveCommunityMessages = (data: any) => {
            console.log("Loading community history:", data.messages.length);
            setId(data.id);
            // Verify if mapping is needed. Backend sends CommunityMessage which has communityId.
            // We map it to look like MessageI just in case
            const mapped = data.messages.map((m: any) => ({ ...m, roomId: m.communityId }));
            setMessages(mapped);
        }

        // Handler for new regular messages (including your own)
        const handleReceiveMessage = (data: MessageI) => {
            if (data.roomId !== chat) return;
            console.log("Received new message:", data);

            setMessages((prevMessages) => {
                const isDuplicate = prevMessages.some((msg) =>
                    msg.id === data.id ||
                    (msg.message === data.message && msg.senderId === data.senderId &&
                        Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 1000)
                );

                if (isDuplicate) return prevMessages;
                return [...prevMessages, data];
            });
        };

        const handleReceiveCommunityMessage = (data: any) => {
            if (data.communityId !== chat) return;
            console.log("Received new community message:", data);
            const mapped = { ...data, roomId: data.communityId };
            setMessages((prevMessages) => {
                // duplicate check
                if (prevMessages.some(m => m.id === mapped.id)) return prevMessages;
                return [...prevMessages, mapped];
            });
        }

        const handleDeletedCommunityMessage = (msgId: string) => {
            // We can't check communityId easily here unless backend sends it. 
            // But deletion is harmless if id doesn't exist.
            setMessages((prevMessages) => prevMessages.filter((el) => el.id !== msgId));
        }

        const handleReceiveCommunityMessageUpdate = (data: any) => {
            console.log("Received community message update:", data);
            const mapped = { ...data, roomId: data.communityId };
            setMessages((prevMessages) => prevMessages.map(msg =>
                msg.id === mapped.id ? mapped : msg
            ));
        }

        // Handler for AI messages (user's message sent to AI)
        const handleReceiveMessageAI = (data: MessageI) => {
            if (data.roomId !== chat) return;
            console.log("Received AI message:", data);

            setMessages((prevMessages) => {
                const isDuplicate = prevMessages.some((msg) => msg.id === data.id);
                if (isDuplicate) {
                    return prevMessages;
                }
                return [...prevMessages, data];
            });

            // Generate AI response only once per message
            if (!aiRequestedForMessages.has(data.id)) {
                aiRequestedForMessages.add(data.id);
                socket?.emit("generatingResponseFromAI", { val: data.message, chat });
            }
        };

        // Handler for deleted messages
        const handleDeletedMessage = (messageId: string) => {
            console.log("Message deleted:", messageId);
            setMessages((prevMessages) => prevMessages.filter((el) => el.id !== messageId));
        };

        const handleCommunityCallStarted = (data: any) => {
            console.log("Call started:", data);
            // No need to add ephemeral message, backend sends persistent one
        };

        const handleCommunityCallEnded = (data: any) => {
            console.log("Call ended event:", data);
            // Do not remove the call message, keep it for history
        };

        // Register event listeners
        socket.on("receiveMessages", handleReceiveMessages);
        socket.on("receiveMessage", handleReceiveMessage);

        socket.on("receiveCommunityMessages", handleReceiveCommunityMessages);
        socket.on("receiveCommunityMessage", handleReceiveCommunityMessage);
        socket.on("deletedCommunityMessage", handleDeletedCommunityMessage);
        socket.on("receiveCommunityMessageUpdate", handleReceiveCommunityMessageUpdate);

        socket.on("receiveMessageAI", handleReceiveMessageAI); // Note: Original code had duplicate listener? Fixed implicitly if I replace
        socket.on("DeletedMessage", handleDeletedMessage);
        socket.on("communityCallStarted", handleCommunityCallStarted);
        socket.on("communityCallEnded", handleCommunityCallEnded);

        // Cleanup function
        return () => {
            socket.off("receiveMessages", handleReceiveMessages);
            socket.off("receiveMessage", handleReceiveMessage);

            socket.off("receiveCommunityMessages", handleReceiveCommunityMessages);
            socket.off("receiveCommunityMessage", handleReceiveCommunityMessage);
            socket.off("deletedCommunityMessage", handleDeletedCommunityMessage);
            socket.off("receiveCommunityMessageUpdate", handleReceiveCommunityMessageUpdate);

            socket.off("receiveMessageAI", handleReceiveMessageAI);
            socket.off("receiveMessageAI", handleReceiveMessageAI);
            socket.off("DeletedMessage", handleDeletedMessage);
            socket.off("communityCallStarted", handleCommunityCallStarted);
            socket.off("communityCallEnded", handleCommunityCallEnded);
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
        handleChatsWithAI,

        isCommunity,
        setMessages
    };
}