import { FC, useCallback, useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { HomeRightProps } from "./HomeRight";
import { Label } from "./ui/label";
import { FaMagnifyingGlass } from "react-icons/fa6";
import UserCard, { activePreviousUserI } from "./UserCard";
import { useRecoilState } from "recoil";
import { currChat } from "@/store/atom";
import axios from "axios";
import { UserI } from "../../../backend_template/src/shared";

const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export interface roomsI {
    id: string;
    room: string;
    creatorId: string;
    participantId: string;
    creator: UserI;
    participant: UserI;
}

const HomeLeft: FC<HomeRightProps> = ({ socket }) => {
    const [name, setName] = useState<string>('');
    const [searchList, setSearchList] = useState<activePreviousUserI[]>([]);
    const [debouncedName, setDebouncedName] = useState<string>('');
    const [userId, setId] = useState<string>('');
    const [allPrevPrivateRooms, setAllPrevPrivateRooms] = useState<Array<roomsI>>([]);
    // const cChat = useRecoilValue<string>(currChat);
    const [cChat, setCChat] = useRecoilState(currChat);

    const handleChangeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const getAllPrevPrivateRooms = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_SERVER_URL}user/all-previous-private-rooms`, {
                withCredentials: true
            })
            console.log(res);
            setId(() => res.data.id);
            setAllPrevPrivateRooms(() => res.data.rooms);
        } catch (err) {
            console.log("HomeLeft.tsx", err);
        }
    }, []);

    const fetchActiveUserList = useCallback(async () => {
        try {
            console.log(debouncedName);
            socket?.emit("activeUserSearchList", debouncedName);
        } catch (err) {
            console.log(err);
        }
    }, [debouncedName, socket])

    const handleUserClick = useCallback((id: string) => {
        console.log("Previous Chat: ", cChat);
        socket?.emit('privateRoom', { id, cChat });
        console.log("Hello There", id);
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
                console.log(data, ' from server')
                socket.emit("joiningRoom", data);
            })

            socket.on("joinedRoom", (room) => {
                console.log(room);
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
        getAllPrevPrivateRooms().then(() => {
            // getUsernames();
            console.log('working fine');
        }).catch(err => console.log(err));
    }, [])

    return (
        <div className="flex flex-col w-[25%] px-1">
            <Label className="flex justify-between items-center border rounded-md px-4">
                <FaMagnifyingGlass />
                <input placeholder="Find someone..." value={name} onChange={handleChangeName} className="flex h-12 w-full rounded-md outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" />
            </Label>
            {
                searchList.length > 0 ?
                    <div className="absolute z-10 top-32 rounded-md bg-[hsl(var(--primary-foreground))] w-[25%]">
                        <ScrollArea className="min-w-[100%] p-4">
                            <div className="overflow-y-auto h-fit flex flex-col gap-2">
                                {searchList.map((el: activePreviousUserI) => (
                                    <UserCard name={el?.name} id={el?.id} key={el?.id} handleClick={handleUserClick} />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    : null
            }
            <ScrollArea className="min-w-[25%] h-full py-4">
                <div className="flex flex-col gap-2 w-[100%]">
                    {
                        allPrevPrivateRooms.map((el) => {
                            const usercardName = el.creatorId !== userId ? el.creator.name : el.participant.name
                            const usercardId = el.creatorId !== userId ? el.creatorId : el.participantId
                            return (
                                <UserCard key={el.id} name={usercardName.split(' ')[0] || usercardName} id={usercardId} handleClick={handleUserClick} />
                            )
                        })
                    }
                </div>
            </ScrollArea>
        </div>
    );
}

export default HomeLeft