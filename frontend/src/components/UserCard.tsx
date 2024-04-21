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

export interface activePreviousUserI {
    name: string;
    id: string;
    handleClick: (id: string) => void;
    options: boolean;
}

const UserCard: FC<activePreviousUserI> = ({ name, id, handleClick, options }) => {
    const { selected, handleChat } = useUserCard(id, handleClick, name)

    return (
        <div data-id={id} className={`cursor-pointer border max-h-14 p-4 flex text-wrap justify-between ${selected ? 'bg-primary-foreground' : ''} items-center rounded-md`}>
            <p className="px-4" onClick={handleChat}>
                {name}
            </p>
            {
                options &&
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="hover:bg-[hsl(var(--muted))] py-2 px-1 rounded outline-none border-none">
                            <FiMoreVertical className="text-lg" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuItem>
                            <LucideVideo className="mr-2 h-4 w-4" />
                            <span>Video Call</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <LucideMic className="mr-2 h-4 w-4" />
                            <span>Voice Call</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <LucideTrash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            }
        </div>
    );
}

export default UserCard;