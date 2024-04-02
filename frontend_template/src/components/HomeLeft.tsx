import { FC } from "react";
import { ScrollArea } from "./ui/scroll-area";

const HomeLeft: FC = () => {
    return (
        <ScrollArea className="w-[25%] h-full rounded-md border p-4 flex-col flex">
            <div className="flex flex-col gap-2">
            </div>
        </ScrollArea>
    );
}

export default HomeLeft