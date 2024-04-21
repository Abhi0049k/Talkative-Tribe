import { FC, useCallback } from "react";
import { chatI } from "./Chat";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LucideTrash2 } from "lucide-react";
import { FiMoreVertical } from "react-icons/fi";

const MobileChat: FC<chatI> = ({ msg, datetime, yours, msgId, senderId, socket, roomId }) => {
    const handleDelete = useCallback(() => {
        socket.emit("deleteMessage", { msgId, senderId, roomId });
    }, []);

    return (
        <div className={`flex ${yours ? "justify-end" : "justify-start"}`}>
            <div className="bg-primary rounded-md flex">
                <div className="bg-primary rounded-md min-w-44 max-w-[586px]">
                    <p className={`text-background text-base px-2 pt-1 ${yours ? "text-right" : "text-left"}`}>{msg}</p>
                    <div className="flex justify-end items-center pr-1 text-muted text-xs">
                        <span>{datetime ?? "00:00"}</span>
                    </div>
                </div>
                {
                    yours && (

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className=" py-2 px-1 rounded outline-none border-none">
                                    <FiMoreVertical className="text-lg text-primary-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-fit">
                                <DropdownMenuItem onClick={handleDelete}>
                                    <LucideTrash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                }
            </div>
        </div>
    );
}

export default MobileChat