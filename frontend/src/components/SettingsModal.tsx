import { FC } from 'react';
import { useRecoilState } from 'recoil';
import { handednessState } from '@/store/atom';
import { X } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [handedness, setHandedness] = useRecoilState(handednessState);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background border-[3px] border-foreground p-0 relative" style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b-[3px] border-foreground bg-[hsl(var(--secondary))]">
                    <h2 className="font-bold uppercase tracking-wide text-lg text-black">Settings</h2>
                    <button onClick={onClose} className="hover:bg-black/10 p-1 rounded-none transition-colors border-2 border-transparent hover:border-black">
                        <X className="w-6 h-6 text-black" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-bold uppercase text-sm mb-4 border-b-[3px] border-foreground pb-2 w-full">Interface</h3>

                        <div className="space-y-4">
                            <label className="text-sm font-bold uppercase block text-muted-foreground">Global Handedness</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setHandedness('right')}
                                    className={`flex-1 py-4 px-4 border-[3px] border-foreground font-black uppercase text-sm transition-all
                                        ${handedness === 'right'
                                            ? 'bg-foreground text-background shadow-[4px_4px_0_hsl(var(--secondary))] -translate-y-1'
                                            : 'bg-background hover:bg-[hsl(var(--muted))] shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-y-0.5'
                                        }`}
                                >
                                    Right-Handed
                                </button>
                                <button
                                    onClick={() => setHandedness('left')}
                                    className={`flex-1 py-4 px-4 border-[3px] border-foreground font-black uppercase text-sm transition-all
                                        ${handedness === 'left'
                                            ? 'bg-foreground text-background shadow-[4px_4px_0_hsl(var(--secondary))] -translate-y-1'
                                            : 'bg-background hover:bg-[hsl(var(--muted))] shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-y-0.5'
                                        }`}
                                >
                                    Left-Handed
                                </button>
                            </div>
                            <div className="bg-[hsl(var(--muted))] p-3 border-l-[4px] border-foreground text-xs font-semibold uppercase text-muted-foreground leading-relaxed">
                                Controls interactions alignment for {handedness === 'left' ? 'LEFT' : 'RIGHT'} hand usage across Desktop, Tablet and Mobile.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
