import { FC } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { FaMagnifyingGlass } from "react-icons/fa6";
import UserCard, { activePreviousUserI } from "./UserCard";
import { useHomeLeft } from "@/hooks/useHomeLeft";
import { HomeChildProps } from "@mangalam0049k/common";

const HomeLeft: FC<HomeChildProps> = ({ socket }) => {
    const { name, searchList, userId, allPrevPrivateRooms, handleChangeName, handleUserClick } = useHomeLeft(socket);

    return (
        <div className="flex flex-col w-full sm:w-[25%] px-1">
            <Label className="flex justify-between items-center border rounded-md px-4">
                <FaMagnifyingGlass />
                <input placeholder="Find someone..." value={name} onChange={handleChangeName} className="flex h-12 w-full rounded-md outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" />
            </Label>
            {
                (searchList.length === 0 && name)
                    ? (
                        <div className="absolute z-10 top-32 rounded-md bg-[hsl(var(--primary-foreground))] sm:w-[24%] w-[100%]">
                            <div className="overflow-y-auto h-fit flex flex-col gap-2">
                                <div className="cursor-pointer border max-h-14 p-4 flex text-wrap justify-between items-center rounded-md">
                                    Not Found!
                                </div>
                            </div>
                        </div>
                    ) : searchList.length > 0 ?
                        <div className="absolute z-10 top-32 rounded-md bg-[hsl(var(--primary-foreground))] sm:w-[24%] w-[100%]">
                            <ScrollArea className="min-w-[100%] p-4">
                                <div className="overflow-y-auto h-fit flex flex-col gap-2">
                                    {searchList.map((el: activePreviousUserI) => (
                                        <UserCard name={el?.name} id={el?.id} key={el?.id} handleClick={handleUserClick} options={false} />
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
                                <UserCard key={el.id} name={usercardName.split(' ')[0] || usercardName} id={usercardId} handleClick={handleUserClick} options={true} />
                            )
                        })
                    }
                </div>
            </ScrollArea>
        </div>
    );
}

export default HomeLeft