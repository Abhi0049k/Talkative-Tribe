import { LoginInput, RegisterInput } from './../../../backend_template/src/shared/index';
import { Action, CredentialsI } from "@/shared";
import axios, { AxiosResponse } from "axios";
import React, { useCallback, useState } from "react";
import { useNavigate } from 'react-router-dom';

const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

const initialState = {
    name: '',
    email: '',
    password: ''
}

const useAuthentication = (action: Action) => {
    const [credentials, setCredentials] = useState<CredentialsI>(initialState);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const val: string = event.target.value;
        const name: string = event.target.name;
        setCredentials((prev) => ({ ...prev, [name]: val }))
    }, [])

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        try {
            if (action === Action.register) {
                const result = RegisterInput.safeParse(credentials);
                if (result) {
                    const res: AxiosResponse = await axios.post(`${BACKEND_SERVER_URL}user/register`, credentials, {
                        withCredentials: true
                    })
                    console.log(res);
                    navigate("/")
                } else {
                    console.log(result);
                    alert("Invalid Input");
                }
            } else if (action === Action.login) {
                const result = LoginInput.safeParse(credentials);
                if (result) {
                    const res: AxiosResponse = await axios.post(`${BACKEND_SERVER_URL}user/login`, credentials, {
                        withCredentials: true
                    })
                    console.log(res);
                    navigate("/")
                } else {
                    console.log(result);
                    alert("Invalid Input");
                }
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }, [action, credentials])

    return { credentials, loading, handleSubmit, handleChange }
}

export default useAuthentication