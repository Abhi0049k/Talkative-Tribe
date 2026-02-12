
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRecoilValue } from "recoil";
import { tokenState } from "@/store/atom";
import { BACKEND_SERVER_URL } from "@/configs/api";
import { X } from 'lucide-react';
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

interface Member {
    id: string;
    name: string;
    image?: string;
    email: string;
    role: 'OWNER' | 'MEMBER';
}

interface ParticipantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    communityName: string;
}

const ParticipantsModal = ({ isOpen, onClose, communityId, communityName }: ParticipantsModalProps) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [requests, setRequests] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'MEMBERS' | 'REQUESTS'>('MEMBERS');
    const [isAdmin, setIsAdmin] = useState(false);
    const [userId, setUserId] = useState("");
    const token = useRecoilValue(tokenState);

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUserId(decoded.id);
            } catch (e) {
                console.error(e);
            }
        }
    }, [token]);

    useEffect(() => {
        if (isOpen && communityId) {
            setView('MEMBERS'); // Reset view on open
            fetchMembers();
        }
    }, [isOpen, communityId]);

    useEffect(() => {
        if (isOpen && communityId && view === 'REQUESTS') {
            fetchRequests();
        }
    }, [view, isOpen, communityId]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BACKEND_SERVER_URL}user/community/${communityId}/members`, {
                headers: { Authorization: token }
            });
            setMembers(res.data);

            // Check if current user is owner
            const me = res.data.find((m: any) => m.id === userId);
            if (me && me.role === 'OWNER') {
                setIsAdmin(true);
                // fetchRequests(); // Optional: pre-fetch to show count?
                // Let's fetch requests count blindly if admin
                axios.get(`${BACKEND_SERVER_URL}user/community/${communityId}/requests`, {
                    headers: { Authorization: token }
                }).then(r => setRequests(r.data)).catch(() => { });
            } else {
                setIsAdmin(false);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${BACKEND_SERVER_URL}user/community/${communityId}/requests`, {
                headers: { Authorization: token }
            });
            setRequests(res.data);
        } catch (err) {
            console.log("Failed to fetch requests", err);
        }
    };

    const handleApprove = async (userIdToApprove: string) => {
        try {
            await axios.post(`${BACKEND_SERVER_URL}user/community/${communityId}/approve-request`,
                { userIdToApprove },
                { headers: { Authorization: token } }
            );
            setRequests(prev => prev.filter(r => r.id !== userIdToApprove));
            fetchMembers(); // Refresh members list
            toast.success("Approved member");
        } catch (err) {
            toast.error("Failed to approve");
        }
    };

    const handleReject = async (userIdToReject: string) => {
        try {
            await axios.post(`${BACKEND_SERVER_URL}user/community/${communityId}/reject-request`,
                { userIdToReject },
                { headers: { Authorization: token } }
            );
            setRequests(prev => prev.filter(r => r.id !== userIdToReject));
            toast.success("Rejected request");
        } catch (err) {
            toast.error("Failed to reject");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-background border-[3px] border-foreground p-0 relative" style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}>
                <div className="flex justify-between items-center p-4 border-b-[3px] border-foreground bg-[hsl(var(--secondary))]">
                    <div>
                        <h2 className="font-bold uppercase tracking-wide text-lg text-black">{view === 'MEMBERS' ? 'Members' : 'Pending Requests'}</h2>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">{communityName}</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-black/10 p-1 rounded-none transition-colors border-2 border-transparent hover:border-black">
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                {isAdmin && (
                    <div className="flex border-b-[3px] border-foreground">
                        <button
                            onClick={() => setView('MEMBERS')}
                            className={`flex-1 py-2 font-bold uppercase text-xs ${view === 'MEMBERS' ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                            Members ({members.length})
                        </button>
                        <button
                            onClick={() => setView('REQUESTS')}
                            className={`flex-1 py-2 font-bold uppercase text-xs ${view === 'REQUESTS' ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                            Requests ({requests.length})
                        </button>
                    </div>
                )}

                <div className="p-0">
                    {loading ? (
                        <div className="p-8 text-center uppercase font-bold text-sm">Loading...</div>
                    ) : (
                        <ScrollArea className="h-[300px] bg-background">
                            <div className="p-0">
                                {view === 'MEMBERS' ? (
                                    <div className="p-2 space-y-1">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 border-b-2 border-transparent hover:border-muted transition-colors">
                                                <div className={`w-8 h-8 flex items-center justify-center font-bold text-xs border-[2px] border-foreground ${member.role === 'OWNER' ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm">{member.name}</span>
                                                        {member.role === 'OWNER' && (
                                                            <span className="text-[9px] bg-foreground text-background px-1.5 py-0 rounded-sm font-bold uppercase">Owner</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {requests.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground text-xs uppercase font-bold">No pending requests</div>
                                        ) : (
                                            requests.map((req) => (
                                                <div key={req.id} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50 border-b-2 border-transparent hover:border-muted transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 flex items-center justify-center font-bold text-xs border-[2px] border-foreground bg-muted text-foreground">
                                                            {req.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-sm block">{req.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{req.email}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleApprove(req.id)} className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold uppercase px-2 py-1 border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">
                                                            Accept
                                                        </button>
                                                        <button onClick={() => handleReject(req.id)} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParticipantsModal;
