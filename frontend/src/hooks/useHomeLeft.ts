import { activeChatUserName, currChat, tokenState, joinedCommunitiesState } from "@/store/atom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { Socket } from "socket.io-client";
import axios, { AxiosResponse } from "axios";
import { activePreviousUserI } from "@/components/UserCard";
import { roomsI } from "@mangalam0049k/common";

import { BACKEND_SERVER_URL } from "@/configs/api";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

export const useHomeLeft = (socket: Socket) => {
    const [name, setName] = useState<string>('');
    const [searchList, setSearchList] = useState<activePreviousUserI[]>([]);
    const [debouncedName, setDebouncedName] = useState<string>('');
    const [userId, setId] = useState<string>('');
    const [allPrevPrivateRooms, setAllPrevPrivateRooms] = useState<Array<roomsI>>([]);
    const [cChat, setCChat] = useRecoilState(currChat);
    const token = useRecoilValue(tokenState);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [communityToDelete, setCommunityToDelete] = useState<{ id: string; name: string } | null>(null);

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

            socket.on("member_left", ({ communityId, userId: leftUserId }) => {
                let currentId = "";
                if (token) {
                    try {
                        const decoded: any = jwtDecode(token);
                        currentId = decoded.id;
                    } catch (e) {
                        // ignore
                    }
                }

                if (currentId === leftUserId) {
                    setJoinedCommunities(prev => prev.filter(c => c.id !== communityId));
                    setCChat(prev => prev === communityId ? "" : prev);
                }
            });
        }
        return () => {
            if (socket) {
                socket.off("activeUserList");
                socket.off("room");
                socket.off("joinRoom");
                socket.off("joinedRoom");
                socket.off("roomDeleted");
                socket.off("member_left");
            }
        }
    }, [socket, token])


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


    // Communities Logic
    const [joinedCommunities, setJoinedCommunities] = useRecoilState(joinedCommunitiesState);

    const getJoinedCommunities = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_SERVER_URL}user/communities`, {
                headers: { Authorization: token }
            });
            setJoinedCommunities(res.data.communities);
        } catch (err) {
            console.log(err);
        }
    }, [token]);

    useEffect(() => {
        if (token) getJoinedCommunities();
    }, [token, getJoinedCommunities]);

    const handleCommunityClick = useCallback((communityId: string, name: string) => {
        // Set current chat to community ID
        setCChat(communityId);
        setActiveUserName(name); // Or store community name separately if needed

        // Join the socket room
        socket?.emit("joinCommunityRoom", { communityId });

        // Fetch messages (handled by side effect in HomeRight usually, but we can trigger it here if needed)
        socket?.emit("getCommunityMessages", communityId);
    }, [socket, setCChat, setActiveUserName]);

    const handleDeleteCommunity = useCallback(async (communityId: string) => {
        // Find community name for modal
        const community = joinedCommunities.find(c => c.id === communityId);
        if (!community) return;

        // Open modal instead of window.confirm
        setCommunityToDelete({ id: communityId, name: community.name });
        setIsDeleteModalOpen(true);
    }, [joinedCommunities]);

    const confirmDeleteCommunity = useCallback(async () => {
        if (!communityToDelete) return;

        const { id: communityId, name: communityName } = communityToDelete;

        try {
            await axios.delete(`${BACKEND_SERVER_URL}user/community/${communityId}`, {
                headers: { Authorization: token }
            });

            toast.success(`Community "${communityName}" deleted successfully`);

            // Optimistic update
            setJoinedCommunities(prev => prev.filter(c => c.id !== communityId));

            // Clear active chat if deleted community was active
            if (cChat === communityId) {
                setCChat("");
            }

            // Close modal
            setIsDeleteModalOpen(false);
            setCommunityToDelete(null);
        } catch (error: any) {
            console.error("Failed to delete community", error);
            const errorMessage = error.response?.data?.message || "Failed to delete community. Please try again.";
            toast.error(errorMessage);
        }
    }, [communityToDelete, token, cChat, setCChat]);

    const cancelDeleteCommunity = useCallback(() => {
        setIsDeleteModalOpen(false);
        setCommunityToDelete(null);
    }, []);

    // Get current user ID from token
    const getCurrentUserId = useCallback(() => {
        if (!token) return null;
        try {
            const decoded: any = jwtDecode(token);
            return decoded.id;
        } catch (e) {
            console.error("Invalid token", e);
            return null;
        }
    }, [token]);

    return {
        name,
        searchList: filteredSearchList,
        userId,
        allPrevPrivateRooms: displayRooms,
        joinedCommunities,
        handleChangeName,
        handleUserClick,
        handleChatWithAI,
        handleDeleteRoom,
        refreshCommunities: getJoinedCommunities,
        handleCommunityClick,
        handleDeleteCommunity,
        getCurrentUserId,
        // Delete modal state and handlers
        isDeleteModalOpen,
        communityToDelete,
        confirmDeleteCommunity,
        cancelDeleteCommunity
    }
}