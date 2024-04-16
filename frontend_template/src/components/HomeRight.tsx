import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Socket } from "socket.io-client";
import { useRecoilValue } from "recoil";
import { currChat } from "@/store/atom";
import "../index.css"
import Chat from "./Chat";
import NoPreviousChats from "./NoPreviousChats";

export interface HomeRightProps {
    socket?: Socket;
}

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

const HomeRight: FC<HomeRightProps> = ({ socket }) => {
    const chat = useRecoilValue(currChat);
    const [val, setVal] = useState<string>('');
    const [messages, setMessages] = useState([]);
    const [userId, setId] = useState<string>('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }

    const handleClick = useCallback(() => {
        try {
            socket?.emit("sendingMsg", val);
        } catch (err) {
            console.log(err);
        }
    }, [val])

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setVal(event.target.value);
    }, [])

    useEffect(() => {
        console.log(chat);
        if (chat)
            socket?.emit('privateMessages', chat);
        scrollToBottom();
    }, [chat, socket])

    useEffect(() => {
        if (socket) {
            socket.on("receiveMessages", (data) => {
                console.log(data);
                setId(() => data.id)
                setMessages(() => data.messages)
            })
        }
    }, [socket])

    return (
        <div className="w-[75%] h-full rounded-md mx-1 flex flex-col">
            {

                chat ? (
                    <>
                        {/* <div className="h-[90vh] flex gap-4 flex-col p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200" ref={chatContainerRef}>
                            <Chat msg="Hello There" yours={true} datetime={"20th Jan, 2024"} />
                            <Chat msg="Hello There" yours={false} datetime={"20th Jan, 2024"} />
                            <Chat msg="Hello There" yours={true} datetime={"20th Jan, 2024"} />
                            <Chat msg="Hello There" yours={false} datetime={"20th Jan, 2024"} />
                            <Chat msg="Hello There" yours={true} datetime={"20th Jan, 2024"} />
                            <Chat msg="Hello There. My name is Mangalam Kumar and I from Lucknow" yours={true} datetime="5th april, 2024" />
                            <Chat msg="Hello There. My name is Mangalam Kumar and I from Lucknow. Hello There. My name is Mangalam Kumar and I from Lucknow. Hello There. My name is Mangalam Kumar and I from Lucknow. Hello There. My name is Mangalam Kumar and I from Lucknow" yours={false} datetime="5th april, 2024" />
                            <Chat msg="Hello There. My name is Mangalam Kumar and I from Lucknow. Hello There. My name is Mangalam Kumar and I from Lucknow. Hello There. My name is Mangalam Kumar and I from Lucknow. Hello There. My name is Mangalam Kumar and I from Lucknow" yours={true} datetime="5th april, 2024" />
                        </div> */}
                        {
                            messages.length !== 0 ? messages.map((el: MessageI) => {
                                return (
                                    <Chat msg={el.message} yours={el.senderId === userId} datetime={el.createdAt.toDateString()} />
                                )
                            }) : <NoPreviousChats />
                        }
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 sm:gap-2">
                            <input
                                value={val}
                                onChange={handleChange}
                                className="h-10 border rounded-md col-span-5 outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <Button className="text-xl col-span-1" onClick={handleClick}>Send</Button>
                        </div>

                    </>
                ) : (
                    <div className="flex w-full h-full justify-center items-center">
                        <p className="text-xl text-[hsl(var(--secondary))]">
                            Currently, there are no active chats. Feel free to start a new conversation and connect with others!
                        </p>
                    </div>
                )
            }
        </div>
    )
}

export default HomeRight