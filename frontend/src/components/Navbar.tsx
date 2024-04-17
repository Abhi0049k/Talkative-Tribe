import { FC } from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { useNavbar } from "@/hooks/useNavbar";

const Navbar: FC = () => {
    const { name, LogoutUser } = useNavbar();

    return (
        <nav className="flex border py-2 px-4 justify-between items-center">
            <h1 className="text-xl hidden md:block font-semibold">Talkative Tribe</h1>
            <h1 className="text-xl rounded-full border font-semibold h-12 w-12 flex justify-center items-center md:hidden">TT</h1>
            <div className="flex gap-4 items-center">
                <p className="text-xl">Hi👋 {name.split(' ')[0]}</p>
                <ModeToggle />
                <Button onClick={LogoutUser}>Logout</Button>
            </div>
        </nav>
    );
}

export default Navbar;