import { FC } from "react";
import { Button } from "./ui/button";

interface DeleteCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    communityName: string;
}

const DeleteCommunityModal: FC<DeleteCommunityModalProps> = ({ isOpen, onClose, onConfirm, communityName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background border-[3px] border-foreground p-6 max-w-md w-full shadow-[8px_8px_0_hsl(var(--foreground))]">
                <h2 className="text-2xl font-bold uppercase mb-4 text-red-600">Delete Community?</h2>

                <div className="mb-6">
                    <p className="text-sm font-bold mb-3 uppercase">
                        You are about to delete <span className="text-red-600">"{communityName}"</span>
                    </p>

                    <p className="text-sm font-medium mb-2 uppercase">This will permanently delete:</p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground mb-4 font-bold uppercase space-y-1 ml-2">
                        <li>The community</li>
                        <li>All chats and messages</li>
                        <li>All posts</li>
                        <li>All media files</li>
                        <li>All member associations</li>
                    </ul>

                    <div className="bg-red-50 border-l-4 border-red-600 p-3 mb-4">
                        <p className="text-xs font-bold text-red-600 uppercase">
                            ⚠️ This action cannot be undone
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={onClose}
                        className="flex-1 bg-white text-foreground border-[3px] border-foreground hover:bg-gray-100 font-bold uppercase rounded-none h-12"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 text-white border-[3px] border-foreground hover:bg-red-700 font-bold uppercase rounded-none h-12"
                    >
                        Delete Forever
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCommunityModal;
