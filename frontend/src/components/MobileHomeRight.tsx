import { useHomeRight } from "@/hooks/useHomeRight";
import { FC, useEffect, useState } from "react";
import { HomeChildProps, MessageI } from "@mangalam0049k/common";
import MobileHomeFirst from "./MobileHomeFirst";
import MobileChat from "./MobileChat";
import moment from "moment";
import NoPreviousChats from "./NoPreviousChats";
import { Button } from "./ui/button";
import { useRecoilValue } from "recoil";
import { handednessState } from "@/store/atom";

const MobileHomeRight: FC<HomeChildProps> = ({ socket }) => {
    const { chat, messages, chatContainerRef, userId, val, handleChange, handleClick, handleChatsWithAI } = useHomeRight(socket);
    const [chatWithAI, setChatWithAI] = useState<boolean>(false);
    const AI_BOT_ID: string = import.meta.env.VITE_AI_BOT_ID || "";
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';

    useEffect(() => {
        const ids: Array<string> = chat.split("-#=#-");
        if (ids[1] === AI_BOT_ID) setChatWithAI(true);
        else setChatWithAI(false);
    }, [chat, AI_BOT_ID]);

    return (
        <div className={`${chat ? "flex" : "hidden"} flex-col sm:hidden absolute bg-background w-full h-[87vh]`}>
            {/* Header */}
            <MobileHomeFirst socket={socket} />

            {/* AI Mode Badge */}
            {chatWithAI && (
                <div className={`px-4 py-2 bg-[hsl(var(--secondary))] border-b-[3px] border-foreground flex ${isLeftHanded ? 'justify-start' : 'justify-end'}`}>
                    <span className="font-bold text-black text-xs uppercase">🤖 AI MODE ACTIVE</span>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                {messages.length !== 0 ? (
                    <div
                        className="h-full px-4 py-4 flex flex-col gap-4 overflow-y-auto"
                        ref={chatContainerRef}
                        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--muted)) 40px, hsl(var(--muted)) 41px)' }}
                    >
                        {messages.map((el: MessageI) => (
                            <MobileChat
                                key={el.id}
                                msgId={el.id}
                                senderId={el.senderId}
                                msg={el.message}
                                yours={el.senderId === userId}
                                roomId={el.roomId}
                                datetime={moment(el.createdAt).format("Do MMM, LT")}
                                socket={socket}
                                isAIResponse={chatWithAI && el.senderId === AI_BOT_ID}
                            />
                        ))}
                    </div>
                ) : (
                    <NoPreviousChats />
                )}
            </div>

            {/* Input - Layout changes based on handedness */}
            <div className="p-3 border-t-[3px] border-foreground bg-background">
                <div className={`flex gap-2 ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
                    <input
                        value={val}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                chatWithAI ? handleChatsWithAI() : handleClick();
                            }
                        }}
                        placeholder="TYPE MESSAGE..."
                        className={`flex-1 h-12 border-[3px] border-foreground bg-background px-3 py-2 text-sm font-medium uppercase tracking-wide placeholder:text-muted-foreground focus:outline-none ${isLeftHanded ? 'text-right' : 'text-left'}`}
                    />
                    <Button
                        className="h-12 px-6 bg-foreground text-background border-[3px] border-foreground font-bold uppercase hover:bg-[hsl(var(--secondary))] hover:text-black rounded-none"
                        onClick={chatWithAI ? handleChatsWithAI : handleClick}
                    >
                        {isLeftHanded ? '← SEND' : 'SEND →'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default MobileHomeRight;