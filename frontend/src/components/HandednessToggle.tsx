import { FC } from "react";
import { useRecoilState } from "recoil";
import { handednessState, Handedness } from "@/store/atom";

interface HandednessToggleProps {
    className?: string;
}

const HandednessToggle: FC<HandednessToggleProps> = ({ className = "" }) => {
    const [handedness, setHandedness] = useRecoilState(handednessState);

    const handleToggle = (value: Handedness) => {
        setHandedness(value);
    };

    return (
        <div className={`${className}`}>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">
                ONE-HAND MODE
            </label>
            <div className="flex border-[3px] border-foreground bg-background">
                <button
                    onClick={() => handleToggle('left')}
                    className={`
                        flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors
                        ${handedness === 'left'
                            ? 'bg-[hsl(var(--secondary))] text-black'
                            : 'bg-background text-foreground hover:bg-[hsl(var(--muted))]'
                        }
                    `}
                >
                    🫲 LEFT
                </button>
                <div className="w-[3px] bg-foreground" />
                <button
                    onClick={() => handleToggle('right')}
                    className={`
                        flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors
                        ${handedness === 'right'
                            ? 'bg-[hsl(var(--secondary))] text-black'
                            : 'bg-background text-foreground hover:bg-[hsl(var(--muted))]'
                        }
                    `}
                >
                    RIGHT 🫱
                </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
                {handedness === 'left'
                    ? "Actions placed on the left for left-hand use"
                    : "Actions placed on the right for right-hand use"
                }
            </p>
        </div>
    );
};

export default HandednessToggle;
