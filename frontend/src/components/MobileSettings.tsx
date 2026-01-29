import { FC, useState } from "react";
import { useRecoilValue } from "recoil";
import { handednessState } from "@/store/atom";
import HandednessToggle from "./HandednessToggle";
import { LucideSettings, LucideX } from "lucide-react";

const MobileSettings: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const handedness = useRecoilValue(handednessState);

    return (
        <>
            {/* Settings Button - Position based on handedness */}
            <button
                onClick={() => setIsOpen(true)}
                className={`
                    fixed bottom-24 z-40 sm:hidden
                    w-12 h-12 bg-foreground text-background border-[3px] border-foreground
                    flex items-center justify-center
                    hover:bg-[hsl(var(--secondary))] hover:text-black transition-colors
                    ${handedness === 'left' ? 'left-4' : 'right-4'}
                `}
                style={{ boxShadow: '3px 3px 0 hsl(var(--foreground))' }}
                aria-label="Open Settings"
            >
                <LucideSettings className="w-5 h-5" />
            </button>

            {/* Settings Drawer */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 sm:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer - Opens from the side based on handedness */}
                    <div
                        className={`
                            fixed top-0 bottom-0 w-[85vw] max-w-[320px] z-50 sm:hidden
                            bg-background border-[3px] border-foreground
                            flex flex-col
                            ${handedness === 'left' ? 'left-0 border-l-0' : 'right-0 border-r-0'}
                        `}
                        style={{
                            boxShadow: handedness === 'left'
                                ? '4px 0 0 hsl(var(--foreground))'
                                : '-4px 0 0 hsl(var(--foreground))'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b-[3px] border-foreground bg-[hsl(var(--secondary))]">
                            <h2 className="text-lg font-bold uppercase tracking-wide text-black">
                                SETTINGS
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 bg-black text-white border-[3px] border-black flex items-center justify-center hover:bg-background hover:text-black transition-colors"
                            >
                                <LucideX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Settings Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Handedness Section */}
                            <div className="mb-6">
                                <HandednessToggle />
                            </div>

                            {/* Additional Settings Placeholder */}
                            <div className="border-t-[3px] border-foreground pt-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                                    ABOUT
                                </p>
                                <div className="bg-[hsl(var(--muted))] p-3 border-[3px] border-foreground">
                                    <p className="text-sm font-medium">
                                        <span className="font-bold">TALKATIVE TRIBE</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        A Neo-Brutalist Chat Experience
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Visual Indicator */}
                        <div className="p-4 border-t-[3px] border-foreground bg-[hsl(var(--muted))]">
                            <p className="text-xs font-bold uppercase tracking-wide text-center">
                                {handedness === 'left' ? '🫲 LEFT-HAND MODE' : 'RIGHT-HAND MODE 🫱'}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default MobileSettings;
