import { currChat } from "@/store/atom"
import { useCallback, useEffect, useState } from "react";
import { useRecoilValue } from "recoil"

export const useUserCard = (id: string, handleClick: (id: string) => void) => {
    const cChat = useRecoilValue(currChat);

    const [selected, setSelected] = useState<boolean>(false);

    const handleChat = useCallback(() => {
        handleClick(id);
    }, [handleClick, id])

    useEffect(() => {
        if (cChat.includes(id)) setSelected(true);
        else setSelected(false);
    }, [cChat, id])

    return { selected, handleChat };
}