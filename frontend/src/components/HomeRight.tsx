import { FC, useEffect, useState } from "react";
import { Button } from "./ui/button";
import "../index.css"
import moment from "moment";
import Chat from "./Chat";
import NoPreviousChats from "./NoPreviousChats";
import { useHomeRight } from "@/hooks/useHomeRight";
import { HomeChildProps, MessageI } from "@mangalam0049k/common";
import { useRecoilValue } from "recoil";
import { activeChatUserName, handednessState } from "@/store/atom";

const HomeRight: FC<HomeChildProps> = ({ socket }) => {
    const { chat, messages, chatContainerRef, userId, val, handleChange, handleClick, handleChatsWithAI } = useHomeRight(socket);
    const [chatWithAI, setChatWithAI] = useState<boolean>(false);
    const activeUserName = useRecoilValue(activeChatUserName);
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';
    const AI_BOT_ID: string = import.meta.env.VITE_AI_BOT_ID || "";

    useEffect(() => {
        const ids: Array<string> = chat.split("-#=#-");
        if (ids[1] === AI_BOT_ID) setChatWithAI(true);
        else setChatWithAI(false);
    }, [chat, AI_BOT_ID])

    return (
        <>
            <div className="flex-1 max-h-full sm:flex hidden flex-col bg-background">
                {chat ? (
                    <>
                        {/* Chat Header */}
                        <div className={`px-6 py-4 border-b-[3px] border-foreground bg-background flex items-center justify-between ${isLeftHanded ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isLeftHanded ? 'flex-row-reverse text-right' : ''}`}>
                                <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-bold text-lg border-[3px] border-foreground">
                                    {chatWithAI ? "🤖" : (activeUserName ? activeUserName.slice(0, 2).toUpperCase() : "?")}
                                </div>
                                <div>
                                    <h3 className="font-bold uppercase tracking-wide">
                                        {chatWithAI ? "AI ASSISTANT" : (activeUserName || "CONVERSATION")}
                                    </h3>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        {chatWithAI ? "Powered by Ollama" : "Active now"}
                                    </span>
                                </div>
                            </div>
                            {chatWithAI && (
                                <span className="bg-[hsl(var(--secondary))] text-black px-3 py-1 text-xs font-bold uppercase border-[2px] border-foreground">
                                    AI MODE
                                </span>
                            )}
                        </div>

                        {/* Messages Area */}
                        {messages.length !== 0 ? (
                            <div
                                className="flex-1 flex gap-4 flex-col p-6 overflow-y-auto"
                                ref={chatContainerRef}
                                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--muted)) 40px, hsl(var(--muted)) 41px)' }}
                            >
                                {messages.map((el: MessageI) => (
                                    <Chat
                                        key={el.id}
                                        senderId={el.senderId}
                                        msgId={el.id}
                                        msg={el.message}
                                        yours={el.senderId === userId}
                                        roomId={el.roomId}
                                        datetime={moment(el.createdAt).format("Do MMM, YYYY, LT")}
                                        socket={socket}
                                        isAIResponse={chatWithAI && el.senderId === AI_BOT_ID}
                                    />
                                ))}
                            </div>
                        ) : (
                            <NoPreviousChats />
                        )}

                        {/* Message Input */}
                        <div className="p-4 border-t-[3px] border-foreground bg-background">
                            <div className={`flex gap-3 ${isLeftHanded ? 'flex-row-reverse' : ''}`}>
                                <input
                                    value={val}
                                    onChange={handleChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            chatWithAI ? handleChatsWithAI() : handleClick();
                                        }
                                    }}
                                    placeholder="TYPE YOUR MESSAGE..."
                                    className={`flex-1 h-14 border-[3px] border-foreground bg-background px-4 py-2 text-base font-medium uppercase tracking-wide placeholder:text-muted-foreground focus:outline-none focus:ring-0 ${isLeftHanded ? 'text-right' : 'text-left'}`}
                                    style={{ boxShadow: 'inset 2px 2px 0 hsl(var(--muted))' }}
                                />
                                <Button
                                    className="h-14 px-8 bg-foreground text-background border-[3px] border-foreground font-bold uppercase tracking-wide hover:bg-[hsl(var(--secondary))] hover:text-black transition-colors rounded-none"
                                    onClick={chatWithAI ? handleChatsWithAI : handleClick}
                                    style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                                >
                                    {isLeftHanded ? '← SEND' : 'SEND →'}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* No Chat Selected State */
                    <div className="flex w-full h-full justify-center items-center p-8">
                        <div className="text-center max-w-md">
                            <div className="w-24 h-24 mx-auto mb-6 bg-[hsl(var(--secondary))] border-[3px] border-foreground flex items-center justify-center" style={{ boxShadow: '6px 6px 0 hsl(var(--foreground))' }}>
                                <span className="text-4xl">💬</span>
                            </div>
                            <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">NO ACTIVE CHAT</h2>
                            <p className="text-muted-foreground font-medium uppercase text-sm tracking-wide">
                                SELECT A CONVERSATION FROM THE SIDEBAR OR START CHATTING WITH THE AI ASSISTANT
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default HomeRight;