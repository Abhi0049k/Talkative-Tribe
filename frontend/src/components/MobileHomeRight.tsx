import { useHomeRight } from "@/hooks/useHomeRight";
import { FC } from "react";
import { HomeChildProps, MessageI } from "@mangalam0049k/common";
import MobileHomeFirst from "./MobileHomeFirst";
import MobileChat from "./MobileChat";
import moment from "moment";
import NoPreviousChats from "./NoPreviousChats";
import { Button } from "./ui/button";

const MobileHomeRight: FC<HomeChildProps> = ({ socket }) => {
    const { chat, messages, chatContainerRef, userId, val, handleChange, handleClick } = useHomeRight(socket)

    return (
        <div className={`${chat ? "flex" : "hidden"} flex-col sm:hidden absolute bg-background  w-full h-[87vh] gap-1`}>
            <MobileHomeFirst socket={socket} />
            <div className="h-[84%]">
                {
                    messages.length !== 0 ? (
                        <div className="h-[100%] px-2 flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200" ref={chatContainerRef}>

                            {messages.map((el: MessageI) => {
                                return (
                                    <MobileChat key={el.id} msgId={el.id} senderId={el.senderId} msg={el.message} yours={el.senderId === userId} roomId={el.roomId} datetime={moment(el.createdAt).format("Do MMM, YYYY, LT")} socket={socket} />
                                )
                            })}
                        </div>
                    ) : <NoPreviousChats />
                }
            </div>
            <div className="grid grid-cols-4 gap-4 px-2">
                <input
                    value={val}
                    onChange={handleChange}
                    placeholder="Message"
                    className="h-[6vh] border rounded-md col-span-3 outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button className="h-[6vh] text-xl col-span-1" onClick={handleClick}>Send</Button>
            </div>
        </div>
    );
}

export default MobileHomeRight