import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRecoilState } from "recoil";
import { tokenState } from "@/store/atom";

import { BACKEND_SERVER_URL } from "@/configs/api";

export const useNavbar = () => {
    // const token = useRecoilValue(tokenState);
    const [token, setToken] = useRecoilState(tokenState);
    const [name, setName] = useState<string>("");
    const navigate = useNavigate();

    const fetchUser = useCallback(async () => {
        try {
            const res = await axios.post(`${BACKEND_SERVER_URL}user/info`, { token }, {
                withCredentials: true,
            })
            setName(res.data.name);
        } catch (err) {
            console.log(err);
        }
    }, []);

    const LogoutUser = useCallback(async () => {
        try {
            localStorage.removeItem("token");
            setToken("");
            await axios.get(`${BACKEND_SERVER_URL}user/logout`, {
                "headers": {
                    "Authorization": token
                }
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