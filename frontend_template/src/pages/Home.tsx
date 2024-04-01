import HomeLeft from "@/components/HomeLeft";
import HomeRight from "@/components/HomeRight";
import { io } from "socket.io-client";
import { FC, useEffect } from "react";
const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

const Home: FC = () => {

    useEffect(() => {
        document.title = "Home | Talkative Tribe";
        const socket = io(BACKEND_SERVER_URL, { transports: ['websocket'] });
        socket.on("connect", () => {
            console.log("finally connected");
        })

        socket.on("message", (msg) => {
            console.log("reaching here");
            console.log(msg);
        })
    }, []);


    return (
        <div className="flex h-[90vh] mt-2">
            <HomeRight />
            <HomeLeft />
        </div>
    )
}

export default Home;