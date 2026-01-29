import HomeLeft from "@/components/HomeLeft";
import HomeRight from "@/components/HomeRight";
import MobileHomeRight from "@/components/MobileHomeRight";
import MobileSettings from "@/components/MobileSettings";
import socketIo from "@/configs/socket-io";
import { tokenState, handednessState } from "@/store/atom";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Socket } from "socket.io-client";

const Home: FC = () => {
    const token = useRecoilValue(tokenState);
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';

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
    }, [token, navigate]);

    return (
        <div className={`flex h-[calc(100vh-64px)] bg-background relative ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
            {sockt && (
                <>
                    <HomeLeft socket={sockt} />
                    <HomeRight socket={sockt} />
                    <MobileHomeRight socket={sockt} />

                    {/* Mobile Settings Button - Only visible on mobile */}
                    <MobileSettings />
                </>
            )}
        </div>
    )
}

export default Home;
