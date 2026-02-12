import { FC, useEffect, useState } from "react";
import { Button } from "./ui/button";
import "../index.css"
import moment from "moment";
import Chat from "./Chat";
import NoPreviousChats from "./NoPreviousChats";
import { useHomeRight } from "@/hooks/useHomeRight";
import ParticipantsModal from "./ParticipantsModal";
import CreatePostModal from "./CreatePostModal";
import PostCard from "./PostCard";
import { HomeChildProps } from "@mangalam0049k/common";
import { activeChatUserName, handednessState, triggerCallState, currChat, joinedCommunitiesState } from "@/store/atom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Menu, Users, LogOut } from "lucide-react";
import axios from "axios";
import { BACKEND_SERVER_URL } from "@/configs/api";
import CallJoinCard from "./CallJoinCard";
import { jwtDecode } from "jwt-decode";
import DeleteCommunityModal from "./DeleteCommunityModal";
import toast from "react-hot-toast";
import CallSummaryCard from "./CallSummaryCard";

const HomeRight: FC<HomeChildProps> = ({ socket }) => {
    const { chat, messages, chatContainerRef, userId, val, handleChange, handleClick, handleChatsWithAI, isCommunity, setMessages } = useHomeRight(socket);
    const setCChat = useSetRecoilState(currChat);
    const setJoinedCommunities = useSetRecoilState(joinedCommunitiesState);
    const [chatWithAI, setChatWithAI] = useState<boolean>(false);
    const activeUserName = useRecoilValue(activeChatUserName);
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';
    const AI_BOT_ID: string = import.meta.env.VITE_AI_BOT_ID || "";

    // Reply state
    const [replyingTo, setReplyingTo] = useState<any | null>(null);

    // Community Modals State
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Global Call Trigger
    const [, setTriggerCall] = useRecoilState(triggerCallState);

    const startCall = (type: 'voice' | 'video') => {
        // Trigger global call handler in Home.tsx
        setTriggerCall({
            recipientId: isCommunity ? chat : chat.replace("-#=#-", "").replace(userId, ""),
            recipientName: activeUserName,
            type,
            isDirect: !isCommunity,
            action: 'start'
        });
    };

    const joinCall = (type: 'voice' | 'video') => {
        setTriggerCall({
            recipientId: isCommunity ? chat : chat.replace("-#=#-", "").replace(userId, ""),
            recipientName: activeUserName,
            type,
            isDirect: !isCommunity,
            action: 'join'
        });
    };

    // Remove Call Join Cards when call ends
    useEffect(() => {
        if (!socket) return;
        const handleCallEnd = (data: any) => {
            console.log("Cleaning up call cards for:", data.communityId);
            if (data.communityId === chat) {
                setMessages(prev => prev.filter((m: any) => m.type !== 'CALL_STARTED'));
            }
        };
        socket.on('communityCallEnded', handleCallEnd);
        return () => { socket.off('communityCallEnded', handleCallEnd); };
    }, [socket, chat, setMessages]);

    useEffect(() => {
        const ids: Array<string> = chat.split("-#=#-");
        if (ids[1] === AI_BOT_ID || ids[0] === AI_BOT_ID) setChatWithAI(true);
        else setChatWithAI(false);

        // Check admin status when community chat is active
        // Use synchronous token decoding first for immediate feedback
        if (isCommunity && chat) {
            const token = localStorage.getItem('token');
            let currentUserId = userId;

            if (!currentUserId && token) {
                try {
                    const decoded: any = jwtDecode(token);
                    currentUserId = decoded.id;
                } catch (e) {
                    console.error("Invalid token", e);
                }
            }

            if (currentUserId) {
                checkAdminStatus(currentUserId);
            }
        } else {
            setIsAdmin(false);
        }
    }, [chat, AI_BOT_ID, isCommunity, userId]);

    const checkAdminStatus = async (currentUserId: string) => {
        try {
            const res = await axios.get(`${BACKEND_SERVER_URL}/user/community/${chat}/members`, {
                headers: { Authorization: localStorage.getItem('token') }
            });
            const me = res.data.find((m: any) => m.id === currentUserId);
            if (me && me.role === 'OWNER') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (err) {
            console.error("Failed to check admin status", err);
            setIsAdmin(false);
        }
    };

    const [allowAnonPosts, setAllowAnonPosts] = useState(false);
    const joinedCommunitiesValue = useRecoilValue(joinedCommunitiesState);

    useEffect(() => {
        if (isCommunity && chat) {
            const currentComm = joinedCommunitiesValue.find((c: any) => c.id === chat);
            if (currentComm) {
                setAllowAnonPosts(currentComm.allowAnonymousPosts || false);
            }
        }
    }, [chat, isCommunity, joinedCommunitiesValue]);

    const handlePostSubmit = (title: string, body: string, media: string[], isAnonymous: boolean) => {
        if (isCommunity && chat) {
            socket.emit("sendCommunityMessage", {
                communityId: chat,
                message: body,
                image: null,
                title: title,
                type: "POST",
                media: media,
                isAnonymous: isAnonymous
            });
        }
    };

    const handleLeaveCommunity = async () => {
        if (!chat) return;
        try {
            await axios.post(`${BACKEND_SERVER_URL}user/leave-community/${chat}`, {}, {
                headers: { Authorization: localStorage.getItem('token') }
            });

            toast.success("Left community successfully");
            setJoinedCommunities(prev => prev.filter(c => c.id !== chat)); // Remove from sidebar immediately
            setCChat(""); // Clear chat immediately without reload

        } catch (error: any) {
            console.error("Failed to leave community", error);
            const errorMessage = error.response?.data?.message || "Failed to leave community. Please try again.";
            toast.error(errorMessage);
        }
    };



    const confirmDeleteCommunity = async () => {
        if (!chat) return;
        try {
            await axios.delete(`${BACKEND_SERVER_URL}/user/community/${chat}`, {
                headers: { Authorization: localStorage.getItem('token') }
            });

            toast.success("Community deleted successfully");
            setIsDeleteModalOpen(false);
            // Socket event will handle redirect
        } catch (error: any) {
            console.error("Failed to delete community", error);
            const errorMessage = error.response?.data?.message || "Failed to delete community. Please try again.";
            toast.error(errorMessage);
        }
    };

    const handleReply = (msg: any) => {
        setReplyingTo(msg);
        // Focus input
        const input = document.querySelector('input[placeholder="TYPE YOUR MESSAGE..."]') as HTMLInputElement;
        if (input) input.focus();
    };

    const handleRepost = (msg: any) => {
        if (isCommunity && chat) {
            // Repost immediately as a new post referencing the old one
            socket.emit("sendCommunityMessage", {
                communityId: chat,
                message: "", // Reposts usually have empty body or custom caption, for now empty implies direct repost
                image: null,
                title: null,
                type: "POST", // Repost is just a post with repostId
                repostId: msg.id
            });
        }
    };

    // We need to intercept the default handleClick to support replyToId for communities
    const [allowAnonMessages, setAllowAnonMessages] = useState(false);
    const [sendAnonymously, setSendAnonymously] = useState(false);

    useEffect(() => {
        if (isCommunity && chat) {
            const currentComm = joinedCommunitiesValue.find((c: any) => c.id === chat);
            if (currentComm) {
                setAllowAnonPosts(currentComm.allowAnonymousPosts || false);
                setAllowAnonMessages(currentComm.allowAnonymousMessages || false);
                // Reset toggle if feature disabled
                if (!currentComm.allowAnonymousMessages) setSendAnonymously(false);
            }
        }
    }, [chat, isCommunity, joinedCommunitiesValue]);

    const handleCommunityClick = () => {
        if (isCommunity && chat) {
            socket.emit("sendCommunityMessage", {
                communityId: chat,
                message: val,
                image: null,
                title: null,
                type: "MESSAGE",
                replyToId: replyingTo ? replyingTo.id : null,
                isAnonymous: sendAnonymously
            });
            setReplyingTo(null);
            // We need to manually clear the input in the hook if possible, or force it here.
            // `handleChange` updates state in hook. Passing empty string clears it?
            handleChange({ target: { value: "" } } as any);
        } else {
            handleClick();
        }
    };

    return (
        <div className="flex-1 max-h-full sm:flex hidden flex-col bg-background">
            {chat ? (
                <>
                    {/* Chat Header */}
                    <div className={`px-6 py-4 border-b-[3px] border-foreground bg-background flex items-center justify-between ${isLeftHanded ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isLeftHanded ? 'flex-row-reverse text-right' : ''}`}>
                            <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-bold text-lg border-[3px] border-foreground">
                                {chatWithAI ? "🤖" : (activeUserName ? activeUserName.slice(0, 2).toUpperCase() : (isCommunity ? "#" : "?"))}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold uppercase tracking-wide">
                                        {chatWithAI ? "AI ASSISTANT" : (activeUserName || "CONVERSATION")}
                                    </h3>
                                    {isCommunity && (
                                        <span className="text-[10px] bg-[hsl(var(--secondary))] text-foreground px-1.5 py-0.5 font-bold uppercase border-2 border-foreground">
                                            Community
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                    {chatWithAI ? "Powered by Ollama" : (isCommunity ? "Public Channel" : "Active now")}
                                </span>
                            </div>
                        </div>

                        {isCommunity ? (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startCall('voice')}
                                    className="border-[3px] border-foreground rounded-none font-bold uppercase text-[10px] h-8"
                                >
                                    Voice
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startCall('video')}
                                    className="border-[3px] border-foreground rounded-none font-bold uppercase text-[10px] h-8"
                                >
                                    Video
                                </Button>
                                {isAdmin && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="border-[3px] border-foreground rounded-none font-bold uppercase text-[10px] h-8 bg-red-600 text-white hover:bg-red-700 hover:text-white"
                                    >
                                        Delete
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-[3px] border-foreground rounded-none font-bold uppercase text-[10px] h-8 flex items-center gap-2"
                                        >
                                            Options <Menu className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-48 border-[3px] border-foreground bg-background rounded-none p-0" align="end" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
                                        <div className="p-1">
                                            <DropdownMenuItem
                                                onClick={() => setIsParticipantsOpen(true)}
                                                className="font-bold uppercase text-xs cursor-pointer hover:bg-[hsl(var(--secondary))] focus:bg-[hsl(var(--secondary))] rounded-none py-2"
                                            >
                                                <Users className="w-3 h-3 mr-2" /> View Members
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={handleLeaveCommunity}
                                                className="font-bold uppercase text-xs cursor-pointer hover:bg-red-100 focus:bg-red-100 text-red-600 focus:text-red-600 rounded-none py-2"
                                            >
                                                <LogOut className="w-3 h-3 mr-2" /> Leave Community
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            chatWithAI ? (
                                <span className="bg-[hsl(var(--secondary))] text-black px-3 py-1 text-xs font-bold uppercase border-[2px] border-foreground">
                                    AI MODE
                                </span>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startCall('voice')}
                                        className="border-[3px] border-foreground rounded-none font-bold uppercase text-[10px] h-8"
                                    >
                                        Voice
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startCall('video')}
                                        className="border-[3px] border-foreground rounded-none font-bold uppercase text-[10px] h-8"
                                    >
                                        Video
                                    </Button>
                                </div>
                            )
                        )}
                    </div>

                    {/* Messages Area */}
                    {messages.length !== 0 ? (
                        <div
                            className="flex-1 flex gap-4 flex-col p-6 overflow-y-auto"
                            ref={chatContainerRef}
                            style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--muted)) 40px, hsl(var(--muted)) 41px)' }}
                        >
                            {messages.map((el: any) => {
                                if (el.type === "CALL_STARTED") {
                                    return (
                                        <CallJoinCard
                                            key={el.id}
                                            callerName={el.callerName || el.sender?.name || "Unknown"}
                                            type={el.callType || el.title || "video"}
                                            timestamp={moment(el.createdAt).format("Do MMM, YYYY, LT")}
                                            onJoin={() => joinCall(el.callType || el.title || "video")}
                                            onIgnore={() => setMessages(prev => prev.filter(m => m.id !== el.id))}
                                        />
                                    );
                                }
                                if (el.type === "CALL_ENDED") {
                                    let data = { callerName: "Unknown", duration: "0s", participantCount: 0, endedAt: el.createdAt };
                                    try {
                                        data = JSON.parse(el.message); // Parse the rich data
                                    } catch (e) {
                                        console.error("Failed to parse call summary:", e);
                                    }

                                    return (
                                        <CallSummaryCard
                                            key={el.id}
                                            callerName={data.callerName}
                                            duration={data.duration}
                                            participantCount={data.participantCount}
                                            endedAt={data.endedAt || el.createdAt}
                                        />
                                    )
                                }

                                const senderName = el.sender?.name || "Unknown";
                                if (el.type === "POST") {
                                    return (
                                        <PostCard
                                            key={el.id}
                                            id={el.id}
                                            title={el.title}
                                            message={el.message}
                                            content={el.message}
                                            senderId={el.senderId}
                                            createdAt={el.createdAt}
                                            socket={socket}
                                            communityId={el.roomId || chat}
                                            yours={el.senderId === userId}
                                            media={el.media || []}
                                            likes={el.likes || []}
                                            repost={el.repost}
                                            replyTo={el.replyTo}
                                            currentUserId={userId}
                                            onReply={() => handleReply(el)}
                                            onRepost={() => handleRepost(el)}
                                            isAnonymous={el.isAnonymous}
                                            senderName={senderName}
                                        />
                                    )
                                }
                                return (
                                    <Chat
                                        key={el.id}
                                        senderId={el.senderId}
                                        senderName={senderName}
                                        msgId={el.id}
                                        msg={el.message}
                                        yours={el.senderId === userId}
                                        roomId={el.roomId || chat} // fallback
                                        datetime={moment(el.createdAt).format("LT")}
                                        socket={socket}
                                        isAIResponse={chatWithAI && el.senderId === AI_BOT_ID}
                                        isCommunity={isCommunity}
                                        isAnonymous={el.isAnonymous}
                                    />
                                )
                            })}
                        </div>
                    ) : (
                        <NoPreviousChats />
                    )}

                    {/* Message Input */}
                    <div className="p-4 border-t-[3px] border-foreground bg-background">
                        {isCommunity && (
                            <div className="flex justify-between mb-2">
                                {allowAnonMessages && (
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sendAnonymously}
                                            onChange={(e) => setSendAnonymously(e.target.checked)}
                                            className="w-3 h-3 border-2 border-foreground accent-black"
                                        />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                                            Send Anonymously
                                        </span>
                                    </label>
                                )}
                                <div className="ml-auto">
                                    <button
                                        onClick={() => setIsCreatePostOpen(true)}
                                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
                                    >
                                        <span className="text-lg leading-none">+</span> Create Post
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reply Banner */}
                        {replyingTo && (
                            <div className="bg-[hsl(var(--muted))] border-l-[4px] border-foreground p-2 mb-2 flex justify-between items-center animate-in slide-in-from-bottom-2">
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-bold text-foreground">Replying to {replyingTo.sender?.name || 'User'}</span>
                                    <div className="truncate max-w-xs italic opacity-80">{replyingTo.message || replyingTo.title || 'Attached Media'}</div>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="text-xl font-bold hover:text-red-500 px-2">&times;</button>
                            </div>
                        )}

                        <div className={`flex gap-3 ${isLeftHanded ? 'flex-row-reverse' : ''}`}>
                            <input
                                value={val || ""}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        chatWithAI ? handleChatsWithAI() : handleCommunityClick();
                                    }
                                }}
                                placeholder={replyingTo ? "Type your reply..." : (isCommunity ? "Message the community..." : "TYPE YOUR MESSAGE...")}
                                className={`flex-1 h-14 border-[3px] border-foreground bg-background px-4 py-2 text-base font-medium uppercase tracking-wide placeholder:text-muted-foreground focus:outline-none focus:ring-0 ${isLeftHanded ? 'text-right' : 'text-left'}`}
                                style={{ boxShadow: 'inset 2px 2px 0 hsl(var(--muted))' }}
                            />
                            <Button
                                className="h-14 px-8 bg-foreground text-background border-[3px] border-foreground font-bold uppercase tracking-wide hover:bg-[hsl(var(--secondary))] hover:text-black transition-colors rounded-none"
                                onClick={chatWithAI ? handleChatsWithAI : handleCommunityClick}
                                style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                            >
                                {isLeftHanded ? '← SEND' : 'SEND →'}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
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

            {isCommunity && (
                <>
                    <ParticipantsModal
                        isOpen={isParticipantsOpen}
                        onClose={() => setIsParticipantsOpen(false)}
                        communityId={chat}
                        communityName={activeUserName}
                    />
                    <CreatePostModal
                        isOpen={isCreatePostOpen}
                        onClose={() => setIsCreatePostOpen(false)}
                        onSubmit={handlePostSubmit}
                        allowAnonymous={allowAnonPosts}
                    />
                    <DeleteCommunityModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={confirmDeleteCommunity}
                        communityName={activeUserName}
                    />
                </>
            )}


        </div>
    );
};

export default HomeRight;