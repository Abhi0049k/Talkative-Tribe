import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Socket } from "socket.io-client";
import { useRecoilValue } from "recoil";
import { currChat } from "@/store/atom";
import "../index.css"

export interface HomeRightProps {
    socket?: Socket;
}

const HomeRight: FC<HomeRightProps> = ({ socket }) => {
    const chat = useRecoilValue(currChat);
    const [val, setVal] = useState<string>('');
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
        scrollToBottom();
    }, [])

    return (
        <div className="w-[75%] border h-full rounded-md mx-1 flex flex-col">
            {

                chat ? (
                    <>
                        <div className="h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200" ref={chatContainerRef}>

                        </div>
                        <div className="flex w-full">
                            <input value={val} onChange={handleChange} className="flex h-10 w-[90%] border rounded-md outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" />
                            <Button className="w-[10%] text-xl" onClick={handleClick}>Send</Button>
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