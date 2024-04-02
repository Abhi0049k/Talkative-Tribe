import { io } from "socket.io-client"
const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export default (token: string) => {
    console.log(token);
    const socket = io(BACKEND_SERVER_URL, { transports: ['websocket'], auth: { token } })
    socket.on("connect", () => {
        console.log("finally connected");
    })
    socket.on('message', (data) => {
        console.log(data);
    })
    socket.on("loginAgain", () => {
        alert("Login Again or refresh the page")
    })

    return socket;
}