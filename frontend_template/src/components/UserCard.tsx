import { FC } from "react";
import { FiMoreVertical } from "react-icons/fi";

const UserCard: FC = () => {
    return (
        <div className="border max-h-14 p-4 flex justify-between items-center rounded-md">
            User 1
            <div className="hover:bg-slate-200 py-2 px-1 rounded">
                <FiMoreVertical className="text-lg" />
            </div>
        </div>
    );
}

export default UserCard;