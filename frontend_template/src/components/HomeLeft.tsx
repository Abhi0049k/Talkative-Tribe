import { FC, useCallback, useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { HomeRightProps } from "./HomeRight";
import { Label } from "./ui/label";
import { FaMagnifyingGlass } from "react-icons/fa6";
import UserCard, { activePreviousUserI } from "./UserCard";

const HomeLeft: FC<HomeRightProps> = ({ socket }) => {
    const [name, setName] = useState<string>('');
    const [searchList, setSearchList] = useState<activePreviousUserI[]>([]);
    const [debouncedName, setDebouncedName] = useState<string>('');

    const handleChangeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const fetchActiveUserList = useCallback(async () => {
        try {
            console.log(debouncedName);
            socket?.emit("activeUserSearchList", debouncedName);
        } catch (err) {
            console.log(err);
        }
    }, [debouncedName, socket])

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

        }
        return () => {
            if (socket) {
                socket.off("activeUserList");
            }
        }
    }, [])

    return (
        <div className="flex flex-col w-[25%]">
            <Label className="flex justify-between items-center border rounded-md px-4">
                <FaMagnifyingGlass />
                <input placeholder="Find someone..." value={name} onChange={handleChangeName} className="flex h-12 w-full rounded-md outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" />
            </Label>
            {
                searchList.length > 0 ?
                    <div className="absolute z-10 top-32 rounded-md bg-[hsl(var(--muted))] w-[25%]">
                        <ScrollArea className="min-w-[100%] p-4">
                            <div className="overflow-y-auto h-fit flex flex-col gap-2">
                                {searchList.map((el: activePreviousUserI) => (
                                    <UserCard name={el?.name} id={el?.id} key={el?.id} />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    : null
            }
            <ScrollArea className="min-w-[25%] h-full p-4">
                <div className="flex flex-col gap-2 w-[100%]">
                    <UserCard name={"Mangalam"} id={"43435435235"} />
                    <UserCard name={"Mangalam"} id={"43435435235"} />
                    <UserCard name={"Mangalam"} id={"43435435235"} />
                    <UserCard name={"Mangalam"} id={"43435435235"} />
                    <UserCard name={"Mangalam"} id={"43435435235"} />
                    <UserCard name={"Mangalam"} id={"43435435235"} />
                </div>
            </ScrollArea>
        </div>
    );
}

export default HomeLeft