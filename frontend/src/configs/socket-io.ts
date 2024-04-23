import { io } from "socket.io-client"

const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL

export default (token: string) => {
    const socket = io(BACKEND_SERVER_URL, { transports: ['websocket'], auth: { token } })

    return socket;
}