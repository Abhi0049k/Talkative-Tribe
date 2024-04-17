import { currChat } from "@/store/atom";
import { FC, useCallback, useEffect, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useRecoilValue } from "recoil";

export interface activePreviousUserI {
    name: string;
    id: string;
    handleClick: (id: string) => void;
}

const UserCard: FC<activePreviousUserI> = ({ name, id, handleClick }) => {
    const cChat = useRecoilValue(currChat);

    const [selected, setSelected] = useState<boolean>(false);

    const handleChat = useCallback(() => {
        handleClick(id);
        // console.log('##########################')
        // console.log(cChat, id)
        // if (id || cChat) {
        //     if (cChat.includes(id)) setSelected(() => true);
        //     else setSelected(() => false);
        // }
        // console.log('##########################')
    }, [handleClick, id])

    useEffect(() => {
        if (cChat.includes(id)) setSelected(true);
        else setSelected(false);
    }, [cChat, id])

    return (
        <div data-id={id} className={`cursor-pointer border max-h-14 p-4 flex text-wrap justify-between ${selected ? 'bg-primary-foreground' : ''} items-center rounded-md`} onClick={handleChat}>
            <p>
                {name}
            </p>
            <div className="hover:bg-[hsl(var(--muted))] py-2 px-1 rounded">
                <FiMoreVertical className="text-lg" />
            </div>
        </div>
    );
}

export default UserCard;