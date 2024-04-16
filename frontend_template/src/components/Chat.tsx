import { FC } from "react";

export interface chatI {
    msg: string;
    datetime: string;
    yours: boolean;
}

const Chat: FC<chatI> = ({ msg, datetime, yours }) => {

    return (
        <div className={`flex ${yours ? "justify-end" : "justify-start"}`}>
            <div className="bg-primary rounded-md min-w-44 max-w-[586px]">
                <p className="text-background text-base px-2 pt-1">{msg}</p>
                <div className="flex justify-end items-center pr-1 text-muted text-xs">
                    <span>{datetime ?? "00:00"}</span>
                </div>
            </div>
        </div>
    );
}

export default Chat