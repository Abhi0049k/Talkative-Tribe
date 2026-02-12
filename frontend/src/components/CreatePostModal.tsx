
import { Button } from "./ui/button";
// import { Label } from "./ui/label"; // Unused import removed
import { useState, useCallback } from "react";
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from "axios";
import { BACKEND_SERVER_URL } from "@/configs/api";
import toast from "react-hot-toast";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, body: string, media: string[], isAnonymous: boolean) => void;
    allowAnonymous: boolean;
}

const CreatePostModal = ({ isOpen, onClose, onSubmit, allowAnonymous }: CreatePostModalProps) => {
    const [body, setBody] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);

        // Create previews
        const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': []
        }
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previews[index]); // Cleanup
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() && files.length === 0) return;

        try {
            setIsUploading(true);
            let mediaPaths: string[] = [];

            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(file => {
                    formData.append('files', file);
                });

                const res = await axios.post(`${BACKEND_SERVER_URL}/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: localStorage.getItem('token')
                    }
                });
                mediaPaths = res.data.paths;
            }

            onSubmit("", body, mediaPaths, isAnonymous);

            // Cleanup
            setBody("");
            setFiles([]);
            setPreviews([]);
            setIsAnonymous(false);
            onClose();
        } catch (err) {
            console.error("Upload failed", err);
            toast.error("Failed to upload media");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background border-[3px] border-foreground p-0 relative" style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}>
                <div className="flex justify-between items-center p-6 border-b-[3px] border-foreground bg-[hsl(var(--secondary))]">
                    <h2 className="font-bold uppercase tracking-wide text-xl text-black">Create Post</h2>
                    <button onClick={onClose} className="hover:bg-black/10 p-1 rounded-none transition-colors border-2 border-transparent hover:border-black">
                        <X className="w-6 h-6 text-black" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Share something with the community..."
                            className="flex w-full bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-[3px] border-foreground rounded-none focus-visible:ring-0 font-medium min-h-[150px] font-sans resize-none outline-none"
                        />
                    </div>

                    {/* Media Upload Area */}
                    <div className="space-y-2">
                        <div
                            {...getRootProps()}
                            className={`border-[3px] border-dashed border-foreground p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                <p className="text-xs font-bold uppercase text-muted-foreground">
                                    {isDragActive ? "Drop files here" : "Drag & drop media or click to select"}
                                </p>
                            </div>
                        </div>

                        {/* Previews */}
                        {previews.length > 0 && (previews.map((url, index) => (
                            <div key={index} className="relative aspect-square border-2 border-foreground group">
                                {files[index]?.type.startsWith('video') ? (
                                    <video src={url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors border border-black"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                        )}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                            </div>
                        )}
                    </div>

                    {/* Anonymous Toggle */}
                    {allowAnonymous && (
                        <div className="flex items-center gap-2 p-2 border-[3px] border-foreground bg-muted/20">
                            <input
                                type="checkbox"
                                id="anon-post"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="w-4 h-4 border-2 border-foreground accent-black cursor-pointer"
                            />
                            <label htmlFor="anon-post" className="font-bold uppercase text-xs cursor-pointer select-none">
                                Post Anonymously
                            </label>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isUploading}
                            className="border-[3px] border-foreground rounded-none font-bold uppercase hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={(!body.trim() && files.length === 0) || isUploading}
                            className="bg-foreground text-background border-[3px] border-foreground rounded-none font-bold uppercase hover:bg-[hsl(var(--secondary))] hover:text-foreground disabled:opacity-50 w-24"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "POST"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
