import { FC, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { LucideChevronLeft, LucideChevronRight, LucideMic, LucideVideo } from "lucide-react";
import { useRecoilState, useRecoilValue } from "recoil";
import { activeChatUserName, currChat, handednessState } from "@/store/atom";
import { HomeChildProps } from "@mangalam0049k/common";

const MobileHomeFirst: FC<HomeChildProps> = ({ socket }) => {
    const [activeUserName, setActiveUserName] = useRecoilState(activeChatUserName);
    const [cChat, setCurrChat] = useRecoilState(currChat);
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';

    const handleLeaveRoom = useCallback(() => {
        socket.emit("leaveRoom", cChat);
    }, [cChat, socket])

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
        <div className={`border-b-[3px] border-foreground px-3 py-3 flex justify-between items-center bg-background ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Back button and user name */}
            <div className={`flex items-center gap-3 ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
                <Button
                    className="w-10 h-10 p-0 bg-foreground text-background border-[3px] border-foreground hover:bg-[hsl(var(--secondary))] hover:text-black rounded-none"
                    onClick={handleLeaveRoom}
                    style={{ boxShadow: '2px 2px 0 hsl(var(--foreground))' }}
                >
                    {isLeftHanded ? <LucideChevronRight className="w-5 h-5" /> : <LucideChevronLeft className="w-5 h-5" />}
                </Button>
                <h1 className="text-lg font-bold uppercase tracking-wide">{activeUserName}</h1>
            </div>

            {/* Action buttons */}
            <div className={`flex items-center gap-2 ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
                <Button
                    variant={"outline"}
                    className="w-10 h-10 p-0 border-[3px] border-foreground hover:bg-[hsl(var(--secondary))] hover:text-black rounded-none"
                >
                    <LucideVideo className="w-4 h-4" />
                </Button>
                <Button
                    variant={"outline"}
                    className="w-10 h-10 p-0 border-[3px] border-foreground hover:bg-[hsl(var(--secondary))] hover:text-black rounded-none"
                >
                    <LucideMic className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default MobileHomeFirst;