import { FC, useCallback, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Socket } from "socket.io-client";

interface HomeRightProps {
    socket?: Socket;
}

const HomeRight: FC<HomeRightProps> = ({ socket }) => {
    const [val, setVal] = useState<string>('');

    const handleClick = useCallback(() => {
        console.log("Value to be sent: ", val);
        try {
            socket?.emit("sendingMsg", val);
            console.log("Message Done");
        } catch (err) {
            console.log(err);
        }
    }, [val, socket])

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setVal(event.target.value);
    }, [])

    return (
        <div className="w-[75%] border h-full rounded-md mx-1 flex flex-col">
            <div></div>
            <div className="flex">
                <Input value={val} onChange={handleChange} />
                <Button onClick={handleClick}>Send</Button>
            </div>
        </div>
    )
}

export default HomeRight