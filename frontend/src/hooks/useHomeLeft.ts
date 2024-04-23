import { currChat } from "@/store/atom";
import { useCallback, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { Socket } from "socket.io-client";
import axios, { AxiosResponse } from "axios";
import { activePreviousUserI } from "@/components/UserCard";
import { roomsI } from "@mangalam0049k/common";

const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export const useHomeLeft = (socket: Socket) => {
    const [name, setName] = useState<string>('');
    const [searchList, setSearchList] = useState<activePreviousUserI[]>([]);
    const [debouncedName, setDebouncedName] = useState<string>('');
    const [userId, setId] = useState<string>('');
    const [allPrevPrivateRooms, setAllPrevPrivateRooms] = useState<Array<roomsI>>([]);
    const [cChat, setCChat] = useRecoilState(currChat);

    const handleChangeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const getAllPrevPrivateRooms = useCallback(async () => {
        try {
            const res: AxiosResponse = await axios.get(`${BACKEND_SERVER_URL}user/all-previous-private-rooms`, {
                withCredentials: true
            })
            setId(() => res.data.id);
            setAllPrevPrivateRooms(() => res.data.rooms);
        } catch (err) {
            console.log("HomeLeft.tsx", err);
        }
    }, []);

    const fetchActiveUserList = useCallback(async () => {
        socket?.emit("activeUserSearchList", debouncedName);
    }, [debouncedName, socket])

    const handleUserClick = useCallback((id: string) => {
        socket?.emit('privateRoom', { id, cChat });
        setName('');
    }, [socket, cChat])

    useEffect(() => {
        if (debouncedName) {
            fetchActiveUserList()
        } else {
            setSearchList([]);
        }
    }, [debouncedName])

    useEffect(() => {
        const delay = 1250;
        const timeout = setTimeout(() => {
            setDebouncedName(name);
        }, delay);
        return () => clearTimeout(timeout);
    }, [name]);

    useEffect(() => {
        if (socket) {
            socket.on("activeUserList", (data) => {
                setSearchList(data);
            })

            socket.on("room", () => {
                getAllPrevPrivateRooms();
            })

            socket.on("joinRoom", (data) => {
                socket.emit("joiningRoom", data);
            })

            socket.on("joinedRoom", (room) => {
                setCChat(room);
            })

        }
        return () => {
            if (socket) {
                socket.off("activeUserList");
                socket.off("room");
                socket.off("joinRoom");
            }
        }
    }, [socket])

    useEffect(() => {
        getAllPrevPrivateRooms().catch(err => console.log(err));
    }, [])

    return { name, searchList, userId, allPrevPrivateRooms, handleChangeName, handleUserClick }
}