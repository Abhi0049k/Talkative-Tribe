
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";
import axios from "axios";
import { useRecoilValue } from "recoil";
import { tokenState } from "@/store/atom";
import { BACKEND_SERVER_URL } from "@/configs/api";
import { X } from 'lucide-react';

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateCommunityModal = ({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [accessType, setAccessType] = useState("OPEN");
    const [allowAnonPosts, setAllowAnonPosts] = useState(false);
    const [allowAnonMessages, setAllowAnonMessages] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const token = useRecoilValue(tokenState);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await axios.post(`${BACKEND_SERVER_URL}user/create-community`,
                {
                    name,
                    description,
                    accessType,
                    allowAnonymousPosts: allowAnonPosts,
                    allowAnonymousMessages: allowAnonMessages
                },
                { headers: { Authorization: token } }
            );
            onSuccess();
            onClose();
            setName("");
            setDescription("");
            setAccessType("OPEN");
            setAllowAnonPosts(false);
            setAllowAnonMessages(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create community");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background border-[3px] border-foreground p-0 relative" style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}>
                <div className="flex justify-between items-center p-6 border-b-[3px] border-foreground bg-[hsl(var(--secondary))]">
                    <h2 className="font-bold uppercase tracking-wide text-xl text-black">Create Community</h2>
                    <button onClick={onClose} className="hover:bg-black/10 p-1 rounded-none transition-colors border-2 border-transparent hover:border-black">
                        <X className="w-6 h-6 text-black" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name" className="font-bold uppercase text-xs tracking-wider">Community Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Tech Enthusiasts"
                            className="border-[3px] border-foreground rounded-none focus-visible:ring-0 font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc" className="font-bold uppercase text-xs tracking-wider">Description (Optional)</Label>
                        <Input
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this community about?"
                            className="border-[3px] border-foreground rounded-none focus-visible:ring-0 font-medium"
                        />
                    </div>

                    <div className="space-y-4 pt-2">
                        {/* Access Type */}
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-xs tracking-wider">Access Type</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="accessType"
                                        value="OPEN"
                                        checked={accessType === 'OPEN'}
                                        onChange={() => setAccessType('OPEN')}
                                        className="w-4 h-4 border-2 border-foreground accent-[hsl(var(--secondary))]"
                                    />
                                    <span className="font-medium group-hover:underline">Open</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="accessType"
                                        value="REQUEST_ONLY"
                                        checked={accessType === 'REQUEST_ONLY'}
                                        onChange={() => setAccessType('REQUEST_ONLY')}
                                        className="w-4 h-4 border-2 border-foreground accent-[hsl(var(--secondary))]"
                                    />
                                    <span className="font-medium group-hover:underline">Request Only</span>
                                </label>
                            </div>
                        </div>

                        {/* Anonymity Settings */}
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-xs tracking-wider">Anonymity Features</Label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer group w-full p-2 border-2 border-transparent hover:bg-muted/50">
                                    <input
                                        type="checkbox"
                                        checked={allowAnonPosts}
                                        onChange={(e) => setAllowAnonPosts(e.target.checked)}
                                        className="w-4 h-4 border-2 border-foreground accent-black"
                                    />
                                    <span className="font-medium text-sm">Allow Anonymous Posts</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group w-full p-2 border-2 border-transparent hover:bg-muted/50">
                                    <input
                                        type="checkbox"
                                        checked={allowAnonMessages}
                                        onChange={(e) => setAllowAnonMessages(e.target.checked)}
                                        className="w-4 h-4 border-2 border-foreground accent-black"
                                    />
                                    <span className="font-medium text-sm">Allow Anonymous Messages</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-[3px] border-foreground rounded-none font-bold uppercase hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-foreground text-background border-[3px] border-foreground rounded-none font-bold uppercase hover:bg-[hsl(var(--secondary))] hover:text-foreground"
                        >
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCommunityModal;
