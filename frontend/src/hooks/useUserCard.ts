import { activeChatUserName, currChat } from "@/store/atom"
import { useCallback, useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil"

export const useUserCard = (id: string, handleClick: (id: string) => void, name: string) => {
    const cChat = useRecoilValue(currChat);
    const setActiveUserName = useSetRecoilState(activeChatUserName);

    const [selected, setSelected] = useState<boolean>(false);

    const handleChat = useCallback(() => {
        console.log(id, name);
        handleClick(id);
        setActiveUserName(name);
    }, [handleClick, id, name])

    useEffect(() => {
        if (cChat.includes(id)) setSelected(true);
        else setSelected(false);
    }, [cChat, id])

    return { selected, handleChat };
}