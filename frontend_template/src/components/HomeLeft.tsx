import { FC } from "react";
import { ScrollArea } from "./ui/scroll-area";
import UserSearch from "./UserSearch";

const HomeLeft: FC = () => {
    return (
        <div className="flex flex-col w-[25%]">
            <UserSearch />
            <ScrollArea className="min-w-[25%] h-full p-4 flex-col flex">
                <div className="flex flex-col gap-2 w-[25%]">
                </div>
            </ScrollArea>
        </div>
    );
}

export default HomeLeft