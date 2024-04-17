import Navbar from "@/components/Navbar";
import React, { FC } from "react";

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}

export default Layout