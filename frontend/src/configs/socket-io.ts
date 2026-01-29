import { io, Socket } from "socket.io-client";

const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL as string;

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
