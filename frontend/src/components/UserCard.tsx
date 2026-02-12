import { useUserCard } from "@/hooks/useUserCard";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { FC } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
    LucideTrash2,
    LucideVideo,
    LucideMic
} from "lucide-react"
import {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "./ui/dropdown-menu";
import { useRecoilValue } from "recoil";
import { handednessState } from "@/store/atom";

export interface activePreviousUserI {
    name: string;
    id: string;
    handleClick: (id: string, name?: string) => void;
    handleDelete?: (id: string) => void;
    options: boolean;
    isAI?: boolean;
    isCommunity?: boolean;
    isOwner?: boolean;
}

const UserCard: FC<activePreviousUserI> = ({ name, id, handleClick, handleDelete, options, isAI = false, isCommunity = false, isOwner = false }) => {
    const { selected, handleChat } = useUserCard(id, handleClick, name);
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';

    // Determine background and text colors based on state
    // Reverted to original consistent styling
    const getCardStyles = () => {
        if (selected) {
            // Selected state - yellow background with black text (same for all)
            return 'bg-[hsl(var(--secondary))] text-black';
        }
        if (isAI) {
            // AI card unselected - black background with white text
            return 'bg-foreground text-background hover:bg-foreground/90';
        }
        // Regular card unselected
        return 'bg-background text-foreground hover:bg-[hsl(var(--muted))]';
    };

    // Selected translation
    const getSelectedTranslation = () => {
        if (!selected) return '';
        return isLeftHanded ? 'sm:translate-x-2 -translate-x-2' : 'translate-x-2';
    };

    return (
        <div
            data-id={id}
            className={`
                cursor-pointer border-b-[3px] border-foreground p-4 flex justify-between items-center
                transition-all duration-100
                ${getCardStyles()}
                ${getSelectedTranslation()}
                ${isLeftHanded ? 'sm:flex-row flex-row-reverse' : 'flex-row'}
            `}
            style={{
                // Stronger Left Indicator (12px) for clear visibility
                boxShadow: selected
                    ? isLeftHanded
                        ? 'inset -12px 0 0 hsl(var(--foreground))'
                        : 'inset 12px 0 0 hsl(var(--foreground))'
                    : 'none'
            }}
        >
            <p
                className={`${selected ? 'font-black' : 'font-semibold'} tracking-wide text-sm flex-1 ${isLeftHanded ? 'sm:text-left text-right' : 'text-left'}`}
                onClick={handleChat}
            >
                {name}
            </p>
            {(options || (isCommunity && isOwner)) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`p-2 border-[2px] border-foreground transition-colors ${selected ? 'bg-black text-white hover:bg-black/80' : 'bg-background hover:bg-[hsl(var(--secondary))]'}`}>
                            <FiMoreVertical className={`text-lg ${selected ? 'text-white' : 'text-foreground'}`} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-48 border-[3px] border-foreground bg-background rounded-none"
                        style={{ boxShadow: '4px 4px 0px hsl(var(--foreground))' }}
                        align={isLeftHanded ? "start" : "end"}
                    >
                        {isCommunity && isOwner ? (
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete && handleDelete(id);
                                }}
                                className="font-semibold uppercase text-sm cursor-pointer hover:bg-red-600 hover:text-white rounded-none text-red-600"
                            >
                                <LucideTrash2 className="mr-2 h-4 w-4" />
                                <span>DELETE COMMUNITY</span>
                            </DropdownMenuItem>
                        ) : (
                            <>
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClick(id, name);
                                        // Trigger video call after a short delay to allow chat to open
                                        setTimeout(() => {
                                            const event = new CustomEvent('triggerCall', { 
                                                detail: { type: 'video', recipientId: id, recipientName: name } 
                                            });
                                            window.dispatchEvent(event);
                                        }, 100);
                                    }}
                                    className="font-semibold uppercase text-sm cursor-pointer hover:bg-[hsl(var(--secondary))] hover:text-black rounded-none"
                                >
                                    <LucideVideo className="mr-2 h-4 w-4" />
                                    <span>VIDEO CALL</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClick(id, name);
                                        // Trigger voice call after a short delay to allow chat to open
                                        setTimeout(() => {
                                            const event = new CustomEvent('triggerCall', { 
                                                detail: { type: 'voice', recipientId: id, recipientName: name } 
                                            });
                                            window.dispatchEvent(event);
                                        }, 100);
                                    }}
                                    className="font-semibold uppercase text-sm cursor-pointer hover:bg-[hsl(var(--secondary))] hover:text-black rounded-none"
                                >
                                    <LucideMic className="mr-2 h-4 w-4" />
                                    <span>VOICE CALL</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete && handleDelete(id);
                                    }}
                                    className="font-semibold uppercase text-sm cursor-pointer hover:bg-[hsl(var(--destructive))] hover:text-white rounded-none"
                                >
                                    <LucideTrash2 className="mr-2 h-4 w-4" />
                                    <span>DELETE</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

export default UserCard;