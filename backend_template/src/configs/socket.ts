import jwt, { JwtPayload } from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';

export interface DecodedUser {
    id: string;
    name: string;
}

const userUpdater = (arr: DecodedUser[], user: DecodedUser) => {
    let present = arr.find((el) => el.id === user.id)
    if (!present) arr.push(user);
}

export default (server: http.Server) => {
    const io = new Server(server);
    let onlineUser: DecodedUser[] = [];
    io.on('connection', async (socket) => {
        const token = socket.handshake.auth.token;
        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload
            userUpdater(onlineUser, { id: decoded.id, name: decoded.name });
        } catch (err) {
            console.log(err);
            socket.emit("loginAgain")
        }
        console.log(onlineUser)
        socket.emit('message', "Hello From Server")

        socket.on('disconnect', () => {
            if (!token) return;
            onlineUser = onlineUser.filter((el) => el.id !== decoded.id);
            console.log("disconnected User: ", decoded);
            console.log("Updated User List: ", onlineUser);
        })

        socket.on('sendingMsg', (val) => {
            io.emit("receivedMsg", val)
        })

        socket.on('activeUserSearchList', (name) => {
            console.log(name)
            const searchList = onlineUser.filter(el => el.name.toLowerCase().includes(name.toLowerCase()))
            console.log("Searching active user: ", searchList);
            socket.emit("activeUserList", searchList);
        })
    })
}