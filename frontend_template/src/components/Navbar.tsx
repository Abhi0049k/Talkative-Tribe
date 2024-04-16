import { FC, useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Navbar: FC = () => {
    const [name, setName] = useState<string>('');
    const navigate = useNavigate();

    const fetchUser = useCallback(async () => {
        try {
            const res = await axios.post('http://localhost:8998/user/info', {}, {
                withCredentials: true,
            })
            setName(res.data.name);
        } catch (err) {
            console.log(err);
        }
    }, []);

    const LogoutUser = useCallback(async () => {
        try {
            await axios.get("http://localhost:8998/user/logout", {
                withCredentials: true
            })
            navigate('/login');
        } catch (err) {
            console.log(err);
        }
    }, [])

    useEffect(() => {
        fetchUser();
    }, [])

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