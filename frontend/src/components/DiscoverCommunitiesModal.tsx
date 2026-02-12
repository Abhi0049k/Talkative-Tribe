import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRecoilValue } from "recoil";
import { tokenState } from "@/store/atom";
import { BACKEND_SERVER_URL } from "@/configs/api";
import { ScrollArea } from "./ui/scroll-area";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { X } from 'lucide-react';
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

interface Community {
    id: string;
    name: string;
    description: string;
    accessType: string;
    memberIds: string[];
    pendingMemberIds: string[];
    _count: { members: number };
}

interface DiscoverCommunitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoinSuccess: () => void;
}

const DiscoverCommunitiesModal = ({ isOpen, onClose, onJoinSuccess }: DiscoverCommunitiesModalProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState("");
    const token = useRecoilValue(tokenState);

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUserId(decoded.id);
            } catch (e) {
                console.error("Invalid token", e);
            }
        }
    }, [token]);

    useEffect(() => {
        if (isOpen) {
            fetchCommunities();
        }
    }, [isOpen, searchTerm]);

    const fetchCommunities = async () => {
        try {
            const res = await axios.get(`${BACKEND_SERVER_URL}user/discover-communities?q=${searchTerm}`);
            setCommunities(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const handleJoin = async (id: string, accessType: string) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.post(`${BACKEND_SERVER_URL}user/join-community/${id}`, {}, {
                headers: { Authorization: token }
            });

            if (res.data.status === "PENDING") {
                toast.success("Request sent successfully!");
                setCommunities(prev => prev.map(c =>
                    c.id === id ? { ...c, pendingMemberIds: [...c.pendingMemberIds, userId] } : c
                ));
            } else {
                toast.success("Joined community successfully!");
                onJoinSuccess();
                onClose();
            }
        } catch (err: any) {
            console.log(err);
            toast.error(err.response?.data?.message || "Failed to join");
        } finally {
            setLoading(false);
        }
    };

    const getButtonState = (comm: Community) => {
        const isMember = comm.memberIds?.includes(userId);
        const isPending = comm.pendingMemberIds?.includes(userId);

        if (isMember) return { text: "Joined", disabled: true, variant: "secondary" };
        if (isPending) return { text: "Pending...", disabled: true, variant: "outline" };
        if (comm.accessType === "REQUEST_ONLY") return { text: "Request to Join", disabled: false, variant: "default" };
        return { text: "Join Now", disabled: false, variant: "default" };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md md:max-w-lg bg-background border-[3px] border-foreground p-0 relative" style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}>
                <div className="flex justify-between items-center p-6 border-b-[3px] border-foreground bg-[hsl(var(--secondary))]">
                    <h2 className="font-bold uppercase tracking-wide text-xl text-black">Discover Communities</h2>
                    <button onClick={onClose} className="hover:bg-black/10 p-1 rounded-none transition-colors border-2 border-transparent hover:border-black">
                        <X className="w-6 h-6 text-black" />
                    </button>
                </div>

                <div className="p-4 border-b-[3px] border-foreground">
                    <div className="relative">
                        <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search communities..."
                            className="pl-10 border-[3px] border-foreground rounded-none focus-visible:ring-0 font-medium h-12"
                        />
                    </div>
                </div>

                <ScrollArea className="h-[300px] bg-background">
                    <div className="p-4 space-y-3">
                        {communities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground uppercase font-bold text-sm">
                                No communities found
                            </div>
                        ) : (
                            communities.map((comm) => {
                                const { text, disabled, variant } = getButtonState(comm);
                                return (
                                    <div key={comm.id} className="border-[3px] border-foreground p-4 hover:bg-muted/20 transition-colors flex justify-between items-center group">
                                        <div className="flex-1 mr-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold uppercase tracking-wide group-hover:underline decoration-2 underline-offset-2">{comm.name}</h3>
                                                {comm.accessType === 'REQUEST_ONLY' && (
                                                    <span className="text-[10px] bg-yellow-200 border border-black px-1 font-bold uppercase">Private</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{comm.description || "No description"}</p>
                                            <div className="mt-2 text-[10px] font-bold uppercase bg-foreground text-background inline-block px-1.5 py-0.5">
                                                {comm._count?.members || 0} Members
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleJoin(comm.id, comm.accessType)}
                                            disabled={loading || disabled}
                                            size="sm"
                                            variant={variant as any}
                                            className={`h-9 px-4 border-[3px] border-foreground rounded-none font-bold uppercase transition-all shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none ${variant === 'secondary' ? 'bg-muted text-muted-foreground shadow-none' : 'bg-[hsl(var(--secondary))] hover:bg-foreground hover:text-background'}`}
                                        >
                                            {text}
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default DiscoverCommunitiesModal;
