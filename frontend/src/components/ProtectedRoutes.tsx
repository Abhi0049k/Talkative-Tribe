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
        if (!cookies.get('token')) {
            return navigate('/login');
        }
        setToken(() => cookies.get('token'));
    }, [navigate, setToken])

    return (
        <>{token && children}</>
    );
}

export default ProtectedRoute