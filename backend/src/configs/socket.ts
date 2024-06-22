import jwt, { JwtPayload } from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import prisma from '../configs/prismaInstance';
import { DecodedUser } from "@mangalam0049k/common";

export interface MessageIdSenderIdI { msgId: string; senderId: string; roomId: string; };

class SocketIOInstance {
    private static instance: Server;
    private static onlineUser: DecodedUser[] = [];
    private constructor(server: http.Server) {
        SocketIOInstance.instance = new Server(server);
        SocketIOInstance.instance.on('connection', async (socket) => {
            const token = socket.handshake.auth.token;
            let decoded: JwtPayload;
            try {
                decoded = jwt.verify(token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload
                SocketIOInstance.userUpdater(SocketIOInstance.onlineUser, { id: decoded.id, name: decoded.name });
            } catch (err) {
                console.log(err);
                socket.emit("loginAgain")
            }
            socket.emit('message', "Hello From Server")

            socket.on('disconnect', () => {
                if (!token) return;
                SocketIOInstance.onlineUser = SocketIOInstance.onlineUser.filter((el) => el.id !== decoded.id);
            })

            socket.on('sendingMsg', async (val) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                const roomId = val.chat;
                const participantId = val.chat.split("-#=#-").join('').split(user.id).join('');
                const msg = await prisma.message.create({
                    data: {
                        senderId: user.id,
                        receiverId: participantId,
                        roomId, message: val.val,
                        img: val?.image
                    }
                })
                SocketIOInstance.instance.to(roomId).emit('receiveMessage', msg);
            })

            socket.on('activeUserSearchList', (name) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                let searchList = SocketIOInstance.onlineUser.filter(el => el.name.toLowerCase().includes(name.toLowerCase()))
                searchList = searchList.filter(el => el.name !== user.name);

                socket.emit("activeUserList", searchList);
            })

            socket.on("privateRoom", async ({ cChat, id }) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                const check = await prisma.room.findFirst({
                    where: {
                        OR: [
                            { creatorId: user.id, participantId: id },
                            { creatorId: id, participantId: user.id }
                        ]
                    }
                });
                if (!check) {
                    const newRoom = await prisma.room.create({ data: { room: user.id + '-#=#-' + id, creatorId: user.id, participantId: id } })
                    SocketIOInstance.instance.emit("room");
                    socket.emit('joinRoom', { activeChat: newRoom.room, prevChat: cChat })
                } else
                    socket.emit('joinRoom', { activeChat: check.room, prevChat: cChat })
            })

            socket.on("joiningRoom", (data) => {
                if (data.prevChat) {
                    socket.leave(data.prevChat);
                }
                socket.join(data.activeChat);
                socket.emit('joinedRoom', data.activeChat);
            })

            socket.on("privateMessages", async (chat) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                if (chat.includes(user.id)) {
                    const messages = await prisma.message.findMany({ where: { roomId: chat } })
                    socket.emit("receiveMessages", { id: user.id, messages });
                }
            })

            socket.on("deleteMessage", async ({ msgId, senderId, roomId }: MessageIdSenderIdI) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                if (senderId !== user.id) return;
                try {
                    const checkmsg = await prisma.message.findUnique({ where: { senderId, id: msgId } });
                    if (checkmsg) {
                        await prisma.message.delete({ where: { id: checkmsg.id } });
                    }

                    SocketIOInstance.instance.to(roomId).emit("DeletedMessage", msgId);
                } catch (er) {
                    console.log(er);
                }
            })

            socket.on("leaveRoom", (cChat) => {
                socket.emit("RoomLeaved")
            })
        })
    }

    private static userUpdater(onlineUser: DecodedUser[], user: DecodedUser) {
        const index = onlineUser.findIndex((u) => u.id === user.id);
        if (index > -1) {
            onlineUser[index] = user;
        } else {
            onlineUser.push(user);
        }
    }

    static getInstance(server: http.Server): Server {
        if (!SocketIOInstance.instance) {
            new SocketIOInstance(server);
        }
        return SocketIOInstance.instance;
    }
}

export default SocketIOInstance