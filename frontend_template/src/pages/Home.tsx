import HomeLeft from "@/components/HomeLeft";
import HomeRight from "@/components/HomeRight";
import socketIo from "@/configs/socket-io";
import { tokenState } from "@/store/atom";
import { FC, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { io, Socket } from "socket.io-client";



const Home: FC = () => {
    const token = useRecoilValue(tokenState);
    const [sockt, setsocket] = useState<Socket>();

    useEffect(() => {
        document.title = "Home | Talkative Tribe";

        const socket = socketIo(token);

        setsocket(socket);

    }, [token]);

    return (
        <div className="flex h-[90vh] mt-2">
            <HomeLeft />
            <HomeRight socket={sockt} />
        </div>
    )
}

export default Home;