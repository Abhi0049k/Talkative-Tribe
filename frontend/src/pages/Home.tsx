import HomeLeft from "@/components/HomeLeft";
import HomeRight from "@/components/HomeRight";
import socketIo from "@/configs/socket-io";
import { tokenState } from "@/store/atom";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Socket } from "socket.io-client";

const Home: FC = () => {
    const token = useRecoilValue(tokenState);
    const [sockt, setsocket] = useState<Socket>();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Home | Talkative Tribe";

        const socket = socketIo(token);

        setsocket(socket);

        socket.on('loginAgain', () => {
            alert("Session expired. Redirecting to Login Page.");
            navigate("/login");
        });
    }, []);

    return (
        <div className="flex h-[90vh] mt-2">
            {
                sockt && (
                    <>
                        <HomeLeft socket={sockt} />
                        <HomeRight socket={sockt} />
                    </>
                )
            }
        </div>
    )
}

export default Home;