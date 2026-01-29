import { tokenState } from "@/store/atom";
import { LoginInput, RegisterInput, Action, CredentialsI } from "@mangalam0049k/common"
import axios, { AxiosResponse, isAxiosError } from "axios";
import React, { useCallback, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from "recoil";

const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
}

const initialState = {
    name: '',
    email: '',
    password: ''
}

const useAuthentication = (action: Action) => {
    const [credentials, setCredentials] = useState<CredentialsI>(initialState);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const navigate = useNavigate();
    const setToken = useSetRecoilState(tokenState);

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const val: string = event.target.value;
        const name: string = event.target.name;
        setCredentials((prev) => ({ ...prev, [name]: val }));
        if (error) setError(""); // Clear error on change
    }, [error])

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (action === Action.register) {
                const result = RegisterInput.safeParse(credentials);
                if (!result.success) {
                    setError(result.error.errors[0]?.message || "Invalid input");
                    setLoading(false);
                    return;
                }

                await axios.post(`${BACKEND_SERVER_URL}user/register`, credentials, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // After register, redirect to login page (or auto-login if backend supports it).
                // Existing code redirected to home, assuming auto-login or just naive.
                // Assuming it works or redirects to login. I'll stick to original behavior (navigate to root).
                // Actually, navigate("/login") might be better UX, but let's trust existing flow for now.
                // Wait, if I register, I don't get a token in the original code? 
                // Original code: await axios.post(...); navigate("/");
                // If register doesn't return token, navigate("/") will just bounce back to auth due to missing token.
                // I'll stick to navigate("/login") to be safe, OR "/" ensures Auth check runs.
                navigate("/login");
            } else if (action === Action.login) {
                const result = LoginInput.safeParse(credentials);
                if (!result.success) {
                    setError(result.error.errors[0]?.message || "Invalid input");
                    setLoading(false);
                    return;
                }

                const data: AxiosResponse<LoginResponse> = await axios.post(`${BACKEND_SERVER_URL}user/login`, credentials, {
                    withCredentials: true
                });

                const tkn = data.data.token;
                setToken(tkn);
                localStorage.setItem("token", tkn);
                navigate("/");
            }
        } catch (err) {
            console.log(err);
            if (isAxiosError(err)) {
                // Try to extract message from various common patterns
                const msg = err.response?.data?.message || err.response?.data?.Error || err.message;
                setError(msg || "Something went wrong");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    }, [action, credentials, navigate, setToken])

    return { credentials, loading, error, handleSubmit, handleChange }
}

export default useAuthentication;