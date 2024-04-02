import { FC, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRecoilValue } from "recoil";
import { socketState } from "@/store/atom";

const HomeRight: FC = () => {
    const [val, setVal] = useState<string>('');
    const socket = useRecoilValue(socketState);

    return (
        <div className="w-[75%] border h-full rounded-md mx-1 flex flex-col">
            <div></div>
            <div className="flex">
                <Input />
                <Button onClick={() => socket.on("sendingMsg", val)}>Send</Button>
            </div>
        </div>
    )
}

export default HomeRight