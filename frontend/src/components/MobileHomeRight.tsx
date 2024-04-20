import { useHomeRight } from "@/hooks/useHomeRight";
import { FC } from "react";
import { HomeChildProps } from "../../../common/src";
import MobileHomeFirst from "./MobileHomeFirst";

const MobileHomeRight: FC<HomeChildProps> = ({ socket }) => {
    const { chat, messages, chatContainerRef, userId, val, handleChange, handleClick } = useHomeRight(socket)

    return (
        <div className={`${chat ? "flex" : "hidden"} flex-col sm:hidden border border-white absolute bg-background  w-full h-[92vh]`}>
            <MobileHomeFirst socket={socket} />
        </div>
    );
}

export default MobileHomeRight