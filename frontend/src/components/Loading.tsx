import { FC } from "react";

const Loading: FC = () => {
    return (
        <div className="flex items-center justify-center h-screen w-full">
            <div className="h-10 w-10 border-[4px] border-slate-800 border-l-transparent rounded-full animate-spin"></div>
        </div>
    )
}

export default Loading