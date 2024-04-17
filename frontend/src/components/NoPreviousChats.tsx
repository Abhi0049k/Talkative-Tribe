import { FC } from "react";

const NoPreviousChats: FC = () => {
    return (
        <div className="flex w-full h-full justify-center items-center">
            <p className="text-xl text-[hsl(var(--secondary))] w-[70%]">
                Currently, there is no conversation going on with this person. Feel free to start a new conversation and connect with others!
            </p>
        </div>
    );
}

export default NoPreviousChats;