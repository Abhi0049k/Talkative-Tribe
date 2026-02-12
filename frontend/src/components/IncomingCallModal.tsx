import { Button } from "./ui/button";
import { PhoneIncoming, PhoneOff, Phone, Video } from "lucide-react";

interface IncomingCallModalProps {
    callerName: string;
    callType?: 'voice' | 'video';
    onAccept: () => void;
    onDecline: () => void;
}

const IncomingCallModal = ({ callerName, callType = 'video', onAccept, onDecline }: IncomingCallModalProps) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border-[3px] border-foreground w-full max-w-sm shadow-[8px_8px_0_hsl(var(--foreground))] p-0">
                <div className="bg-[hsl(var(--secondary))] p-6 flex flex-col items-center border-b-[3px] border-foreground">
                    <div className="w-20 h-20 bg-background border-[3px] border-foreground rounded-full flex items-center justify-center mb-4 animate-pulse">
                        {callType === 'video' ? (
                            <Video className="w-10 h-10" />
                        ) : (
                            <PhoneIncoming className="w-10 h-10" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold uppercase mb-1">{callerName}</h2>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                        Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...
                    </p>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                    <Button
                        onClick={onDecline}
                        variant="destructive"
                        className="h-14 border-[3px] border-foreground rounded-none font-bold uppercase text-lg hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_black]"
                    >
                        <PhoneOff className="mr-2" /> Decline
                    </Button>
                    <Button
                        onClick={onAccept}
                        className="h-14 bg-green-600 hover:bg-green-700 text-white border-[3px] border-foreground rounded-none font-bold uppercase text-lg hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_black]"
                    >
                        <Phone className="mr-2" /> Accept
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
