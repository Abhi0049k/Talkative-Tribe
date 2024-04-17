import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export const useNavbar = () => {
    const [name, setName] = useState<string>("");
    const navigate = useNavigate();

    const fetchUser = useCallback(async () => {
        try {
            const res = await axios.post(`${BACKEND_SERVER_URL}user/info`, {}, {
                withCredentials: true,
            })
            setName(res.data.name);
        } catch (err) {
            console.log(err);
        }
    }, []);

    const LogoutUser = useCallback(async () => {
        try {
            await axios.get(`${BACKEND_SERVER_URL}user/logout`, {
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

    return { name, LogoutUser }
}