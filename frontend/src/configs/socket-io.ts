import { io, Socket } from "socket.io-client";

import { BACKEND_SERVER_URL } from "@/configs/api";

let socket: Socket | null = null;

const getSocket = (token: string): Socket => {
    if (!socket) {
        socket = io(BACKEND_SERVER_URL, {
            transports: ['websocket'],
            auth: { token },
        });
    }
    return socket;
};

export default getSocket;
