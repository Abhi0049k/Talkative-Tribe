import { FC, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { LucideChevronLeft, LucideMic, LucideVideo } from "lucide-react";
import { useRecoilState } from "recoil";
import { activeChatUserName, currChat } from "@/store/atom";
import { HomeChildProps } from "@mangalam0049k/common";

const MobileHomeFirst: FC<HomeChildProps> = ({ socket }) => {
    const [activeUserName, setActiveUserName] = useRecoilState(activeChatUserName);
    const [cChat, setCurrChat] = useRecoilState(currChat);

    const handleLeaveRoom = useCallback(() => {
        socket.emit("leaveRoom", cChat);
    }, [cChat, activeUserName])

    useEffect(() => {
        if (socket) {
            socket.on("RoomLeaved", () => {
                setCurrChat(() => '');
                setActiveUserName(() => "");
                console.log("changing global state of: ", cChat, activeUserName);
            })
        }
        return () => {
            socket.off("RoomLeaved");
        }
    })

    return (
        <div className=" border px-1 py-2 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button className="rounded-full" onClick={handleLeaveRoom}><LucideChevronLeft /></Button>
                <h1 className="text-2xl">{activeUserName}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant={"outline"}><LucideVideo /></Button>
                <Button variant={"outline"}><LucideMic /></Button>
            </div>
        </div>
    );
}

export default MobileHomeFirst