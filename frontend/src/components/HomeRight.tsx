import { FC } from "react";
import { Button } from "./ui/button";
import "../index.css"
import moment from "moment";
import Chat from "./Chat";
import NoPreviousChats from "./NoPreviousChats";
import { useHomeRight } from "@/hooks/useHomeRight";
import { HomeChildProps, MessageI } from "../../../common/src/index";

const HomeRight: FC<HomeChildProps> = ({ socket }) => {
    const { chat, messages, chatContainerRef, userId, val, handleChange, handleClick } = useHomeRight(socket);

    return (
        <>
            <div className="sm:w-[75%] max-h-full rounded-md mx-1 border sm:flex hidden gap-2 flex-col">
                {

                    chat ? (
                        <>
                            {
                                messages.length !== 0
                                    ?
                                    (
                                        <div className="h-[90vh] flex gap-4 flex-col p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200" ref={chatContainerRef}>
                                            {messages.map((el: MessageI) => {
                                                return (
                                                    <Chat key={el.id} senderId={el.senderId} msgId={el.id} msg={el.message} yours={el.senderId === userId} roomId={el.roomId} datetime={moment(el.createdAt).format("Do MMM, YYYY, LT")} socket={socket} />
                                                )
                                            })}
                                        </div>
                                    )
                                    : <NoPreviousChats />
                            }
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-7 sm:gap-2">
                                <input
                                    value={val}
                                    onChange={handleChange}
                                    placeholder="Message"
                                    className="h-10 border rounded-md col-span-6 outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button className="text-xl col-span-1" onClick={handleClick}>Send</Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex w-full h-full  justify-center items-center">
                            <p className="text-xl text-[hsl(var(--secondary))] w-[70%]">
                                Currently, there are no active chats. Feel free to start a new conversation and connect with others!
                            </p>
                        </div>
                    )
                }
            </div>
        </>
    )
}

export default HomeRight