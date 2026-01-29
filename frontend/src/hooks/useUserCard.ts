import { activeChatUserName, currChat } from "@/store/atom"
import { useCallback, useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil"

// export const useUserCard = (id: string, handleClick: (id: string) => void, name: string) => {
//     const cChat = useRecoilValue(currChat);
//     const setActiveUserName = useSetRecoilState(activeChatUserName);

//     const [selected, setSelected] = useState<boolean>(false);

//     const handleChat = useCallback(() => {
//         handleClick(id);
//         setActiveUserName(name);
//     }, [handleClick, id, name, setActiveUserName])

//     useEffect(() => {
//         console.log("coming from line 12: printing id that is received by this hook ", id); // remote user - id
//         console.log("coming from line 12: printing cChat that is received by this hook ", cChat); // room id
//         if (cChat.includes(id)) setSelected(true);
//         else setSelected(false);
//     }, [cChat, id])

//     return { selected, handleChat };
// }

const AI_BOT_ID = import.meta.env.AI_BOT_ID;

export const useUserCard = (id: string, handleClick: (id: string, name?: string) => void, name: string) => {
    const cChat = useRecoilValue(currChat);
    const setActiveUserName = useSetRecoilState(activeChatUserName);

    const [selected, setSelected] = useState<boolean>(false);

    const handleChat = useCallback(() => {
        handleClick(id, name);
        setActiveUserName(name);
    }, [handleClick, id, name, setActiveUserName])

    useEffect(() => {
        console.log("coming from line 12: printing id that is received by this hook ", id);
        console.log("coming from line 12: printing cChat that is received by this hook ", cChat);
        // This logic handles both AI and user chats.
        // It checks if the chat ID includes the current card's ID.
        // This is a more robust way to handle the selection.
        if (id === AI_BOT_ID && cChat.includes(AI_BOT_ID)) {
            setSelected(true);
        } else if (cChat.includes(id) && id !== AI_BOT_ID) {
            setSelected(true);
        } else {
            setSelected(false);
        }
    }, [cChat, id]);

    return { selected, handleChat };
}
