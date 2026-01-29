import { FC } from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { useNavbar } from "@/hooks/useNavbar";
import { useRecoilState } from "recoil";
import { handednessState, Handedness } from "@/store/atom";
import { LucideHand, LucideLogOut } from "lucide-react";

const Navbar: FC = () => {
    const { name, LogoutUser } = useNavbar();
    const [handedness, setHandedness] = useRecoilState(handednessState);
    const isLeftHanded = handedness === 'left';

    // Quick toggle for handedness on mobile
    const toggleHandedness = () => {
        setHandedness((prev: Handedness) => prev === 'left' ? 'right' : 'left');
    };

    // Get user initials
    const getInitials = (fullName: string) => {
        if (!fullName) return "?";
        const parts = fullName.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return fullName.slice(0, 2).toUpperCase();
    };

    return (
        <nav className={`flex py-3 px-4 md:px-6 justify-between items-center border-b-[3px] border-foreground bg-background h-16 ${isLeftHanded ? 'sm:flex-row flex-row-reverse' : 'flex-row'}`}>
            {/* Brand - Compact Neo-Brutalist */}
            <h1 className="text-lg md:text-xl hidden md:flex items-center font-bold uppercase tracking-tight">
                <span className="bg-[hsl(var(--secondary))] text-black px-2 py-0.5 border-[2px] border-foreground inline-block">
                    TT
                </span>
                <span className="ml-2">Talkative Tribe</span>
            </h1>

            {/* Mobile Brand */}
            <div className="md:hidden border-[2px] border-foreground bg-[hsl(var(--secondary))] text-black font-bold h-9 w-9 flex justify-center items-center text-sm">
                TT
            </div>

            {/* Right Section - Clean User Identity */}
            <div className={`flex gap-2 items-center ${isLeftHanded ? 'sm:flex-row flex-row-reverse' : 'flex-row'}`}>
                {/* User Identity Block - Desktop */}
                <div className="hidden sm:flex items-center gap-2 border-[2px] border-foreground px-2 py-1 bg-[hsl(var(--muted))]">
                    {/* Avatar/Initials */}
                    <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {getInitials(name || '')}
                    </div>
                    {/* Username */}
                    <span className="text-sm font-medium uppercase tracking-wide max-w-[120px] truncate">
                        {name?.split(' ')[0] || 'User'}
                    </span>
                </div>

                {/* Mobile User Initial */}
                <div className="sm:hidden w-8 h-8 bg-foreground text-background border-[2px] border-foreground flex items-center justify-center text-xs font-bold">
                    {getInitials(name || '')}
                </div>

                {/* Handedness Quick Toggle - Mobile Only */}
                <Button
                    onClick={toggleHandedness}
                    variant="outline"
                    size="icon"
                    className="sm:hidden h-8 w-8 border-[2px]"
                    title={isLeftHanded ? "Switch to right-hand mode" : "Switch to left-hand mode"}
                >
                    <LucideHand className={`h-4 w-4 ${isLeftHanded ? 'scale-x-[-1]' : ''}`} />
                </Button>

                {/* Theme Toggle */}
                <ModeToggle />

                {/* Logout - Desktop */}
                <Button
                    onClick={LogoutUser}
                    variant="outline"
                    className="hidden sm:flex h-8 px-3 border-[2px] border-foreground font-semibold uppercase text-xs hover:bg-[hsl(var(--destructive))] hover:text-white hover:border-[hsl(var(--destructive))]"
                >
                    <LucideLogOut className="h-3.5 w-3.5 mr-1.5" />
                    Logout
                </Button>

                {/* Logout - Mobile */}
                <Button
                    onClick={LogoutUser}
                    variant="outline"
                    size="icon"
                    className="sm:hidden h-8 w-8 border-[2px] hover:bg-[hsl(var(--destructive))] hover:text-white hover:border-[hsl(var(--destructive))]"
                    title="Logout"
                >
                    <LucideLogOut className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
}

export default Navbar;