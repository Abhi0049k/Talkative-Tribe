import { FC } from "react";
import { Label } from "./ui/label";
import { FaMagnifyingGlass } from "react-icons/fa6";

const UserSearch: FC = () => {

    return (
        <Label className="flex justify-between items-center border rounded-md px-4">
            <FaMagnifyingGlass />
            <input placeholder="Find someone..." className="flex h-10 w-full rounded-md outline-none bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" />
        </Label>
    );
}

export default UserSearch