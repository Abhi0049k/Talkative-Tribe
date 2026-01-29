import { activeChatUserName, currChat, tokenState } from "@/store/atom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
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
    const token = useRecoilValue(tokenState);

    const handleChangeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const getAllPrevPrivateRooms = useCallback(async () => {
        try {
            const res: AxiosResponse = await axios.get(`${BACKEND_SERVER_URL}user/all-previous-private-rooms`, {
                headers: {
                    Authorization: token
                }
            })
            setId(() => res.data.id);
            setAllPrevPrivateRooms(() => res.data.rooms);
        } catch (err) {
            console.log("HomeLeft.tsx", err);
        }
    }, [token]);

    const fetchActiveUserList = useCallback(async () => {
        socket?.emit("activeUserSearchList", debouncedName);
    }, [debouncedName, socket])

    //SECTION - Calling ChatWithAI Event
    const handleChatWithAI = useCallback((_id: string) => {
        socket?.emit("privateRoomWithAI", { id: userId, cChat })
        console.log("Called the event Successfully!");
    }, [cChat, socket, userId])

    const handleDeleteRoom = useCallback((partnerId: string) => {
        const room = allPrevPrivateRooms.find(r =>
            (r.creatorId === partnerId && r.participantId === userId) ||
            (r.creatorId === userId && r.participantId === partnerId)
        );

        if (room) {
            socket?.emit("deleteRoom", room.room);
            // Optimistic update
            setAllPrevPrivateRooms(prev => prev.filter(r => r.room !== room.room));

            // If active chat is deleted, clear it
            if (cChat === room.room) {
                setCChat("");
            }
        }
    }, [allPrevPrivateRooms, socket, userId, cChat, setCChat]);

    useEffect(() => {
        if (debouncedName) {
            fetchActiveUserList()
        } else {
            setSearchList([]);
        }
    }, [debouncedName, fetchActiveUserList])

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

            socket.on("roomDeleted", (roomId) => {
                setAllPrevPrivateRooms(prev => prev.filter(r => r.room !== roomId));
                getAllPrevPrivateRooms(); // Refresh to be sure
            })
        }
        return () => {
            if (socket) {
                socket.off("activeUserList");
                socket.off("room");
                socket.off("joinRoom");
                socket.off("joinedRoom");
                socket.off("roomDeleted");
            }
        }
    }, [socket])

    useEffect(() => {
        getAllPrevPrivateRooms().catch(err => console.log(err));
    }, [])

    // Display all rooms to ensure reliability (no filtering of empty rooms)
    const displayRooms = allPrevPrivateRooms;

    // Derived state to filter out existing conversations and AI bot
    const filteredSearchList = useMemo(() => {
        const existingChatIds = new Set(displayRooms.flatMap(room => [room.creatorId, room.participantId]));
        const aiBotId = import.meta.env.VITE_AI_BOT_ID || "";
        return searchList.filter(user => !existingChatIds.has(user.id) && user.id !== aiBotId);
    }, [searchList, displayRooms]);

    const setActiveUserName = useSetRecoilState(activeChatUserName);

    const handleUserClick = useCallback((id: string, name?: string) => {
        socket?.emit('privateRoom', { id, cChat });
        setName('');
        if (name) setActiveUserName(name);
    }, [socket, cChat, setActiveUserName]);

    // Restore active user name on load
    useEffect(() => {
        if (cChat && allPrevPrivateRooms.length > 0) {
            const currentRoom = allPrevPrivateRooms.find(r => r.room === cChat);
            if (currentRoom) {
                const partnerName = currentRoom.creatorId === userId ? currentRoom.participant.name : currentRoom.creator.name;
                setActiveUserName(partnerName);
            }
        }
    }, [cChat, allPrevPrivateRooms, userId, setActiveUserName]);

    return {
        name,
        searchList: filteredSearchList,
        userId,
        allPrevPrivateRooms: displayRooms,
        handleChangeName,
        handleUserClick,
        handleChatWithAI,
        handleDeleteRoom
    }
}