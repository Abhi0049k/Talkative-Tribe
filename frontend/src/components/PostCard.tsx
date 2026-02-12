
import { FC, useCallback } from "react";
import { Socket } from "socket.io-client";
import MarkdownRenderer from "./MarkdownRenderer";
import moment from "moment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { FiMoreVertical } from "react-icons/fi";
import { LucideTrash2, Heart, Repeat, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { BACKEND_SERVER_URL } from "@/configs/api";

export interface PostCardProps {
    id: string;
    title: string;
    content: string; // Used as message/content
    senderId: string; // Needed for ownership check logic if not using 'yours' entirely or for display
    message: string;
    createdAt: string;
    socket: Socket;
    communityId: string;
    marketing?: boolean;
    yours: boolean;
    media?: string[];
    likes?: any[];
    repost?: any;
    replyTo?: any;
    currentUserId?: string;
    onLike?: () => void;
    onRepost?: () => void;
    onReply?: () => void;
    isAnonymous?: boolean;
    senderName?: string;
}

const PostCard: FC<PostCardProps> = ({
    id,
    title,
    message,
    createdAt,
    socket,
    communityId,
    senderId,
    yours,
    media = [],
    likes = [],
    repost,
    replyTo,
    currentUserId,
    onReply,
    onRepost,
    isAnonymous,
    senderName
}) => {
    // Optimistic or real-time check
    const likedByMe = currentUserId ? likes.some((l: any) => l.userId === currentUserId) : false;

    const handleDelete = useCallback(() => {
        socket.emit("deleteCommunityMessage", { msgId: id, communityId });
    }, [id, communityId, socket]);

    const handleLike = useCallback(() => {
        if (likedByMe) {
            socket.emit("unlikePost", { msgId: id, communityId });
        } else {
            socket.emit("likePost", { msgId: id, communityId });
        }
    }, [id, communityId, socket, likedByMe]);

    // If this is a repost, the "main" content to display is essentially inside the 'repost' object
    // effectively, the current message acts as a wrapper.
    const displayTitle = repost ? (repost.title || "Untitled Repost") : title;
    const displayMessage = repost ? (repost.message || "") : message;
    const displayMedia = repost ? (repost.media || []) : media;
    // We show the REPOSTER as the main author card, but inner content is from ORIGINAL.
    // Actually, prompt says: "Outer container -> reposting user ... Inner container -> original post"

    return (
        <div className={cn(
            "flex w-full my-4 px-4",
            yours ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "w-full max-w-xl bg-background border-[3px] border-foreground relative transition-all",
                yours ? "mr-2 shadow-[6px_6px_0_hsl(var(--foreground))]" : "ml-2 shadow-[-6px_6px_0_hsl(var(--foreground))]"
            )}>
                {/* Header */}
                <div className="border-b-[3px] border-foreground bg-[hsl(var(--muted))] p-4 flex justify-between items-start">
                    <div className="space-y-1 w-full">
                        {repost && (
                            <div className="flex items-center gap-2 mb-2 text-muted-foreground border-b-2 border-dashed border-foreground/30 pb-2">
                                <Repeat className="w-3 h-3" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">
                                    Reposted by You or {senderId === currentUserId ? 'You' : 'Member'}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 inline-block ${repost ? 'bg-[hsl(var(--secondary))] text-foreground' : 'bg-foreground text-background'}`}>
                                    {repost ? 'Shared Post' : 'Community Post'}
                                </span>
                                {!yours && !repost && (
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                        by {isAnonymous ? "Anonymous" : (senderName || "Member")}
                                    </span>
                                )}
                            </div>
                            {yours && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1 hover:bg-background/20 transition-colors rounded-none">
                                            <FiMoreVertical className="text-lg" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-40 border-[3px] border-foreground bg-background rounded-none"
                                        style={{ boxShadow: '4px 4px 0px hsl(var(--foreground))' }}
                                    >
                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            className="font-semibold uppercase text-sm cursor-pointer hover:bg-[hsl(var(--destructive))] hover:text-white rounded-none"
                                        >
                                            <LucideTrash2 className="mr-2 h-4 w-4" />
                                            <span>DELETE</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        {/* If it's a repost, we might show the INNER post title here, or the reposter's caption if any */}
                        <h3 className="font-bold text-xl leading-tight uppercase tracking-tight mt-1">
                            {displayTitle}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-background space-y-4">
                    {replyTo && (
                        <div className="border-l-[4px] border-[hsl(var(--secondary))] bg-[hsl(var(--secondary))]/10 p-3 mb-4">
                            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                                Replying to {replyTo.sender?.name || 'User'}
                            </div>
                            <div className="text-xs italic opacity-80 line-clamp-2">
                                {replyTo.message || replyTo.title || "Image/Media"}
                            </div>
                        </div>
                    )}

                    {repost ? (
                        <div className="border-[2px] border-foreground p-4 bg-background/50">
                            <div className="flex items-center gap-2 mb-2 border-b-2 border-foreground pb-1">
                                <div className="text-xs font-bold uppercase">
                                    {repost.sender?.name || 'Original Author'}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    {moment(repost.createdAt).format("MMM Do")}
                                </span>
                            </div>
                            <MarkdownRenderer
                                content={displayMessage}
                                className="text-left prose-sm prose-p:font-medium prose-headings:font-bold"
                            />
                            {displayMedia && displayMedia.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {displayMedia.map((url: string, idx: number) => {
                                        const fullUrl = url.startsWith('http') ? url : `${BACKEND_SERVER_URL}${url.startsWith('/') ? url.slice(1) : url}`;
                                        const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                                        return (
                                            <div key={idx} className="aspect-video bg-black border border-foreground flex items-center justify-center relative overflow-hidden group">
                                                {isVideo ? (
                                                    <video src={fullUrl} controls className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={fullUrl} alt="Attachment" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <MarkdownRenderer
                                content={message}
                                className="text-left prose-sm prose-p:font-medium prose-headings:font-bold"
                            />

                            {media && media.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {media.map((url: string, idx: number) => {
                                        const fullUrl = url.startsWith('http') ? url : `${BACKEND_SERVER_URL}${url.startsWith('/') ? url.slice(1) : url}`;
                                        const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                                        return (
                                            <div key={idx} className="aspect-video bg-black border-2 border-foreground relative overflow-hidden group">
                                                {isVideo ? (
                                                    <video src={fullUrl} controls className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={fullUrl} alt="Attachment" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="border-t-[3px] border-foreground bg-[hsl(var(--secondary))]/10">
                    <div className="p-3 flex justify-between items-center border-b-[3px] border-foreground sm:border-b-0">
                        {isAnonymous ? (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-[10px] font-bold border-2 border-transparent rounded-sm">
                                    ?
                                </div>
                                <span className="text-xs font-bold uppercase text-muted-foreground">Anonymous</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-[10px] font-bold border-2 border-transparent rounded-sm">
                                    OP
                                </div>
                                <span className="text-xs font-bold uppercase text-muted-foreground">Original Poster</span>
                            </div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {moment(createdAt).format("MMM Do, LT")}
                        </span>
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-3 divide-x-[3px] divide-foreground border-t-[3px] border-foreground">
                        <button
                            onClick={handleLike}
                            className={`p-3 hover:bg-[hsl(var(--secondary))] transition-colors flex items-center justify-center gap-2 group ${likedByMe ? 'bg-[hsl(var(--secondary))]' : ''}`}
                        >
                            <Heart className={`w-4 h-4 transition-transform ${likedByMe ? 'fill-current text-red-500 scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-xs font-bold">{likes.length > 0 ? likes.length : 'Like'}</span>
                        </button>
                        <button
                            onClick={onReply}
                            className="p-3 hover:bg-[hsl(var(--secondary))] transition-colors flex items-center justify-center gap-2 group"
                        >
                            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Reply</span>
                        </button>
                        <button
                            onClick={onRepost}
                            className="p-3 hover:bg-[hsl(var(--secondary))] transition-colors flex items-center justify-center gap-2 group"
                        >
                            <Repeat className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Repost</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
