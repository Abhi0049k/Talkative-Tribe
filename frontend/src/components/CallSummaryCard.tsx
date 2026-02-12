
import React from 'react';
import { Video, Clock, Users } from 'lucide-react';
import moment from 'moment';

interface CallSummaryCardProps {
    callerName: string;
    duration: string;
    participantCount: number;
    endedAt: string;
}

const CallSummaryCard = ({ callerName, duration, participantCount, endedAt }: CallSummaryCardProps) => {
    let dateFormatted = "Just now";
    try {
        dateFormatted = moment(endedAt).format("Do MMM, YYYY, h:mm A");
    } catch (e) {
        console.error("Invalid date for call summary:", e);
    }

    return (
        <div className="flex w-full my-4 px-4 justify-start">
            <div className="w-full max-w-md bg-background border-[3px] border-foreground relative shadow-[-6px_6px_0_hsl(var(--foreground))]">
                <div className="p-4 flex items-center gap-4 bg-[hsl(var(--primary))] text-primary-foreground">
                    <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center border-2 border-transparent">
                        <Video className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold uppercase text-lg leading-none mb-1">
                            Community Call Ended
                        </h3>
                        <p className="text-xs font-bold uppercase opacity-90">
                            {dateFormatted}
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t-[3px] border-foreground bg-background">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Initiated By</p>
                                <p className="font-bold uppercase">{callerName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Duration</p>
                                    <p className="font-bold uppercase">{duration}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Participants</p>
                                    <p className="font-bold uppercase">{participantCount} Joined</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallSummaryCard;
