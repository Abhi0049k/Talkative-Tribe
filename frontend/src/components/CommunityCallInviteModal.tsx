import { Button } from "./ui/button";
import { Video, Mic, PhoneIncoming, PhoneOff } from "lucide-react";
// import moment from "moment"; // Not used in this component

interface CommunityCallInviteModalProps {
    isOpen: boolean;
    callerName: string;
    communityName: string;
    callType: 'voice' | 'video';
    timestamp?: string;
    onJoin: () => void;
    onIgnore: () => void;
}

const CommunityCallInviteModal = ({ 
    isOpen, 
    callerName, 
    communityName, 
    callType, 
    timestamp, 
    onJoin, 
    onIgnore 
}: CommunityCallInviteModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border-[3px] border-foreground w-full max-w-md shadow-[8px_8px_0_hsl(var(--foreground))] p-0">
                {/* Header */}
                <div className="bg-[hsl(var(--secondary))] p-6 flex flex-col items-center border-b-[3px] border-foreground">
                    <div className="w-20 h-20 bg-background border-[3px] border-foreground rounded-full flex items-center justify-center mb-4 animate-pulse">
                        {callType === 'video' ? (
                            <Video className="w-10 h-10" />
                        ) : (
                            <Mic className="w-10 h-10" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold uppercase mb-1">{callerName}</h2>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                        started a {callType === 'video' ? 'video' : 'voice'} call
                    </p>
                    <div className="text-center">
                        <p className="text-sm font-bold uppercase">in {communityName}</p>
                        {timestamp && (
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">
                                {timestamp}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <Button
                        onClick={onIgnore}
                        variant="destructive"
                        className="h-14 border-[3px] border-foreground rounded-none font-bold uppercase text-lg hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_black]"
                    >
                        <PhoneOff className="mr-2" /> Ignore
                    </Button>
                    <Button
                        onClick={onJoin}
                        className="h-14 bg-green-600 hover:bg-green-700 text-white border-[3px] border-foreground rounded-none font-bold uppercase text-lg hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_black]"
                    >
                        <PhoneIncoming className="mr-2" /> Join Call
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CommunityCallInviteModal;