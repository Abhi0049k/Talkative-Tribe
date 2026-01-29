import { FC, useCallback, useMemo } from "react";
import { chatI } from "./Chat";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LucideTrash2 } from "lucide-react";
import { FiMoreVertical } from "react-icons/fi";
import { useRecoilValue } from "recoil";
import { handednessState } from "@/store/atom";
import MarkdownRenderer from "./MarkdownRenderer";

interface MobileChatProps extends chatI {
    isAIResponse?: boolean;
}

const MobileChat: FC<MobileChatProps> = ({ msg, datetime, yours, msgId, senderId, socket, roomId, isAIResponse = false }) => {
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';

    const handleDelete = useCallback(() => {
        socket.emit("deleteMessage", { msgId, senderId, roomId });
    }, [msgId, senderId, roomId, socket]);

    // Detect if message contains rich content
    const hasRichContent = useMemo(() => {
        return msg.includes('```') ||
            msg.includes('# ') ||
            msg.includes('## ') ||
            msg.includes('**') ||
            msg.includes('- ') ||
            msg.includes('1. ') ||
            msg.includes('|') ||
            msg.includes('[') ||
            isAIResponse;
    }, [msg, isAIResponse]);

    // For left-handed mode, swap the alignment of messages
    const getAlignment = () => {
        if (isLeftHanded) {
            return yours ? "justify-start" : "justify-end";
        }
        return yours ? "justify-end" : "justify-start";
    };

    return (
        <div className={`flex ${getAlignment()}`}>
            <div className={`
                ${hasRichContent && !yours ? 'max-w-[95%] min-w-[200px]' : 'max-w-[85%] min-w-[140px]'}
                flex
                ${yours
                    ? "bg-foreground text-background border-[3px] border-foreground"
                    : "bg-[hsl(var(--secondary))] text-black border-[3px] border-foreground"
                }
                ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}
            `}
                style={{
                    boxShadow: yours
                        ? '3px 3px 0 hsl(var(--secondary))'
                        : '3px 3px 0 hsl(var(--foreground))'
                }}
            >
                {/* Message Content */}
                <div className="flex-1">
                    {/* AI Badge */}
                    {isAIResponse && !yours && (
                        <div className="px-3 pt-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wide bg-black text-white px-1 py-0.5">
                                AI
                            </span>
                        </div>
                    )}

                    <div className="px-3 pt-1 pb-0.5">
                        {hasRichContent && !yours ? (
                            <MarkdownRenderer
                                content={msg}
                                className={isLeftHanded ? (yours ? "text-left" : "text-right") : (yours ? "text-right" : "text-left")}
                            />
                        ) : (
                            <p className={`text-sm font-medium leading-normal whitespace-pre-wrap ${isLeftHanded ? (yours ? "text-left" : "text-right") : (yours ? "text-right" : "text-left")}`}>
                                {msg}
                            </p>
                        )}
                    </div>

                    {/* Metadata Row */}
                    <div className={`flex items-center gap-2 px-3 pb-1.5 ${isLeftHanded ? (yours ? "justify-start" : "justify-end") : (yours ? "justify-end" : "justify-start")}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${yours ? "text-muted" : "text-black/60"}`}>
                            {datetime ?? "00:00"}
                        </span>
                    </div>
                </div>

                {/* Delete Action - Only for your messages */}
                {yours && (
                    <div className={`flex items-center ${isLeftHanded ? 'pr-1' : 'pl-1'}`}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-background/20 transition-colors">
                                    <FiMoreVertical className="text-xs" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-32 border-[3px] border-foreground bg-background rounded-none"
                                style={{ boxShadow: '3px 3px 0px hsl(var(--foreground))' }}
                                align={isLeftHanded ? "start" : "end"}
                            >
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="font-semibold uppercase text-xs cursor-pointer hover:bg-[hsl(var(--destructive))] hover:text-white rounded-none"
                                >
                                    <LucideTrash2 className="mr-2 h-3 w-3" />
                                    <span>DELETE</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MobileChat;