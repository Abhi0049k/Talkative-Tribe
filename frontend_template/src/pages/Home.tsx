import HomeLeft from "@/components/HomeLeft";
import HomeRight from "@/components/HomeRight";
import socket from "@/config/socket";
import { socketState, tokenState } from "@/store/atom";
import { FC, useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

const Home: FC = () => {
    const token = useRecoilValue(tokenState);
    const setSocket = useSetRecoilState(socketState);

    useEffect(() => {
        document.title = "Home | Talkative Tribe";
        setSocket(socket(token));
    }, [setSocket]);

    return (
        <div className="flex h-[90vh] mt-2">
            <HomeLeft />
            <HomeRight />
        </div>
    )
}

export default Home;