import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from 'universal-cookie';

const cookies = new Cookies(null, { path: '/' });

const ProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!cookies.get('token')) {
            return navigate('/login');
        }
        setToken(() => cookies.get('token'));
    }, [navigate])

    return (
        <>{token && children}</>
    );
}

export default ProtectedRoute