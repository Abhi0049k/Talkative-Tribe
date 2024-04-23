import { tokenState } from "@/store/atom";
import React, { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import Cookies from 'universal-cookie';

const cookies = new Cookies(null, { path: '/' });

const ProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useRecoilState(tokenState);
    const navigate = useNavigate();

    useEffect(() => {
        const tkn: string = cookies.get('token');
        if (!tkn) {
            return navigate('/login');
        }
        setToken(() => cookies.get('token'));
    }, [])

    return (
        <>{token && children}</>
    );
}

export default ProtectedRoute