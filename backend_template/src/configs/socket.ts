import jwt, { JwtPayload } from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import prisma from '../configs/prismaInstance';

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
    // const user: DecodedUser = { id: '', name: '' };
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
        socket.emit('message', "Hello From Server")

        socket.on('disconnect', () => {
            if (!token) return;
            onlineUser = onlineUser.filter((el) => el.id !== decoded.id);
        })

        socket.on('sendingMsg', (val) => {
            io.emit("receivedMsg", val)
        })

        socket.on('activeUserSearchList', (name) => {
            const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
            let searchList = onlineUser.filter(el => el.name.toLowerCase().includes(name.toLowerCase()))
            searchList = searchList.filter(el => el.name !== user.name);
            console.log("Searching active user: ", searchList);
            socket.emit("activeUserList", searchList);
        })

        socket.on("privateRoom", async ({ cChat, id }) => {
            console.log("####################");
            const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
            const check = await prisma.room.findFirst({
                where: {
                    OR: [
                        { creatorId: user.id, participantId: id },
                        { creatorId: id, participantId: user.id }
                    ]
                }
            });
            console.log('checking: ', check);
            if (!check) {
                const newRoom = await prisma.room.create({ data: { room: user.id + '-#=#-' + id, creatorId: user.id, participantId: id } })
                console.log(newRoom);
                console.log(cChat);
                // if (cChat) {
                //     socket.leave(cChat);
                // }
                io.emit("room");
                console.log({ activeChat: newRoom.room, prevChat: cChat })
                socket.emit('joinRoom', { activeChat: newRoom.room, prevChat: cChat })
            } else {
                console.log({ activeChat: check.room, prevChat: cChat })
                socket.emit('joinRoom', { activeChat: check.room, prevChat: cChat })
            }
            console.log(`${user.id}-#=#-${id}`);
            console.log("####################");
        })
        socket.on("joiningRoom", (data) => {
            console.log("Joining Room: ", data);
            if (data.prevChat) {
                socket.leave(data.prevChat);
            }
            socket.join(data.activeChat);
            socket.emit('joinedRoom', data.activeChat);
        })

        socket.on("privateMessages", async (chat) => {
            console.log("********************************************");
            const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
            console.log('user and chats: ', user, chat);
            if (chat.includes(user.id)) {
                const messages = await prisma.message.findMany({ where: { roomId: chat } })
                console.log("gathering messages from room: ", messages);
                socket.emit("receiveMessages", { id: user.id, messages });
            }
            console.log("********************************************");
        })
    })
}