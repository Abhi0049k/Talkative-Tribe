// "use client"

// import * as React from "react"
// import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FiMoreVertical } from "react-icons/fi"
import { ModeToggle } from "./mode-toggle"

// type Checked = DropdownMenuCheckboxItemProps["checked"]

export default function MediumHam() {


    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="md:hidden" asChild>
                <Button variant="outline" className="p-2"><FiMoreVertical className="text-xl" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-fit">
                <DropdownMenuItem>
                    <ModeToggle />
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Button>Logout</Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
