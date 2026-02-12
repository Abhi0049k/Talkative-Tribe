import { Button } from "./ui/button";
import { Video, Mic, PhoneIncoming } from "lucide-react";

interface CallJoinCardProps {
    callerName: string;
    type: 'voice' | 'video';
    onJoin: () => void;
}

const CallJoinCard = ({ callerName, type, onJoin, onIgnore, timestamp }: CallJoinCardProps & { onIgnore: () => void, timestamp?: string }) => {
    return (
        <div className="flex w-full my-4 px-4 justify-start">
            <div className="w-full max-w-md bg-background border-[3px] border-foreground relative shadow-[-6px_6px_0_hsl(var(--foreground))]">
                <div className="p-4 flex items-center gap-4 bg-[hsl(var(--secondary))]">
                    <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center border-2 border-transparent">
                        {type === 'video' ? <Video className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold uppercase text-lg leading-none mb-1">
                            {callerName} started a call
                        </h3>
                        {timestamp && (
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                                {timestamp}
                            </p>
                        )}
                        <p className="text-xs font-bold uppercase text-muted-foreground">
                            Click to join the session
                        </p>
                    </div>
                </div>
                <div className="p-4 border-t-[3px] border-foreground bg-background flex gap-3">
                    <Button
                        onClick={onJoin}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold uppercase border-[3px] border-foreground rounded-none h-12"
                    >
                        <PhoneIncoming className="w-4 h-4 mr-2" />
                        JOIN
                    </Button>
                    <Button
                        onClick={onIgnore}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase border-[3px] border-foreground rounded-none h-12"
                    >
                        IGNORE
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CallJoinCard;
