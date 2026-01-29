import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { FC, useCallback, useMemo } from "react";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LucideTrash2 } from "lucide-react";
import { FiMoreVertical } from "react-icons/fi";
import { Socket } from "socket.io-client";
import MarkdownRenderer from "./MarkdownRenderer";

export interface chatI {
    msg: string;
    datetime: string;
    yours: boolean;
    socket: Socket;
    senderId: string;
    msgId: string;
    roomId: string;
    isAIResponse?: boolean;
}

const Chat: FC<chatI> = ({ msg, datetime, yours, msgId, senderId, socket, roomId, isAIResponse = false }) => {
    const handleDelete = useCallback(() => {
        socket.emit("deleteMessage", { msgId, senderId, roomId });
    }, [msgId, senderId, roomId, socket]);

    // Detect if message contains rich content (markdown, code, etc.)
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

    return (
        <div className={`flex ${yours ? "justify-end" : "justify-start"}`}>
            <div className={`
                ${hasRichContent && !yours ? 'max-w-[85%] min-w-[300px]' : 'max-w-[70%] min-w-[200px]'}
                ${yours
                    ? "bg-foreground text-background border-[3px] border-foreground"
                    : "bg-[hsl(var(--secondary))] text-black border-[3px] border-foreground"
                }
            `}
                style={{
                    boxShadow: yours
                        ? '4px 4px 0 hsl(var(--secondary))'
                        : '4px 4px 0 hsl(var(--foreground))'
                }}
            >
                {/* AI Badge for AI responses */}
                {isAIResponse && !yours && (
                    <div className="px-4 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-black text-white px-1.5 py-0.5">
                            AI
                        </span>
                    </div>
                )}

                {/* Message Content */}
                <div className="px-4 py-2">
                    {hasRichContent && !yours ? (
                        <MarkdownRenderer
                            content={msg}
                            className={yours ? "text-right" : "text-left"}
                        />
                    ) : (
                        <p className={`text-base font-medium leading-normal whitespace-pre-wrap ${yours ? "text-right" : "text-left"}`}>
                            {msg}
                        </p>
                    )}
                </div>

                {/* Metadata Row */}
                <div className={`flex items-center gap-2 px-4 pb-2 ${yours ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${yours ? "text-muted" : "text-black/60"}`}>
                        {datetime ?? "00:00"}
                    </span>

                    {yours && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-0.5 hover:bg-background/20 transition-colors rounded-none -mr-1">
                                    <FiMoreVertical className="text-xs" />
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
            </div>
        </div>
    );
}

export default Chat;