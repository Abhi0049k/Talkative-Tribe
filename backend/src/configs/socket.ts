import jwt, { JwtPayload } from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import prisma from '../configs/prismaInstance';
import { DecodedUser } from "@mangalam0049k/common";
import { chatWithAI } from './ai/controllers';

export interface MessageIdSenderIdI { msgId: string; senderId: string; roomId: string; };

// Parse allowed origins from environment variable
const FRONTEND_SERVER_URL = process.env.FRONTEND_SERVER_URL || "http://localhost:5173";
const allowedOrigins = FRONTEND_SERVER_URL.split(',').map(origin => origin.trim());

let cnt = 0;

class SocketIOInstance {
    private static instance: Server;
    private static onlineUser: DecodedUser[] = [];
    private constructor(server: http.Server) {
        SocketIOInstance.instance = new Server(server, {
            cors: {
                origin: (origin: any, callback: any) => callback(null, true),
                methods: ["GET", "POST"],
                credentials: true
            }
        });
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
            // socket.on('generatingResponseFromAI', async (val) => {
            //     console.log("reaching generating response from ai")
            //     const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
            //     const roomId = val.chat;
            //     const participantId = process.env.AI_BOT_ID || "";
            //     const res: any = await chatWithAI(val);
            //     const msg = await prisma.message.create({
            //         data: {
            //             senderId: participantId,
            //             receiverId: user.id,
            //             roomId, message: res,
            //             img: res?.image
            //         }
            //     })
            //     SocketIOInstance.instance.to(roomId).emit('receiveMessage', msg);
            // })
            socket.on('generatingResponseFromAI', async (val) => {
                try {
                    console.log("Generating AI response");

                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                    const roomId = val.chat;
                    const participantId = process.env.AI_BOT_ID || "";

                    // Get AI response
                    const res: any = await chatWithAI(val);

                    // Save AI's response
                    const msg = await prisma.message.create({
                        data: {
                            senderId: participantId,
                            receiverId: user.id,
                            roomId,
                            message: res,
                            img: res?.image
                        }
                    });

                    // Broadcast AI response to room
                    SocketIOInstance.instance.to(roomId).emit('receiveMessage', msg);

                } catch (err) {
                    console.log("Error generating AI response:", err);
                    socket.emit('messageError', { error: 'Failed to get AI response' });
                }
            });
            // socket.on('sendingMsgToAI', async (val) => {
            //     console.log("sendingMsgToAI: ", val);
            //     try {
            //         const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
            //         const roomId = val.chat;
            //         const participantId = process.env.AI_BOT_ID || "";
            //         const msg = await prisma.message.create({
            //             data: {
            //                 senderId: user.id,
            //                 receiverId: participantId,
            //                 roomId, message: val?.val,
            //                 img: val?.image
            //             }
            //         })
            //         SocketIOInstance.instance.to(roomId).emit('receiveMessageAI', msg);
            //     } catch (err) {
            //         console.log("Error while fetching data from ai: ", err);
            //     }
            // })
            socket.on('sendingMsgToAI', async (val) => {
                try {
                    console.log("Processing AI message from user:", val);

                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                    const roomId = val.chat;
                    const participantId = process.env.AI_BOT_ID || "";

                    // Save user's message to AI
                    const msg = await prisma.message.create({
                        data: {
                            senderId: user.id,
                            receiverId: participantId,
                            roomId,
                            message: val?.val,
                            img: val?.image
                        }
                    });

                    // Broadcast user's message to room with special AI event
                    SocketIOInstance.instance.to(roomId).emit('receiveMessageAI', msg);

                } catch (err) {
                    console.log("Error while processing AI message:", err);
                    socket.emit('messageError', { error: 'Failed to send message to AI' });
                }
            });
            // socket.on('sendingMsg', async (val) => {
            //     // try {
            //     // console.log(cnt++);
            //     const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
            //     const roomId = val.chat;
            //     const participantId = val.chat.split("-#=#-").join('').split(user.id).join('');
            //     const msg = await prisma.message.create({
            //         data: {
            //             senderId: user.id,
            //             receiverId: participantId,
            //             roomId, message: val.val,
            //             img: val?.image
            //         }
            //     })
            //     SocketIOInstance.instance.to(roomId).emit('receiveMessage', msg);
            //     // } catch (err) {
            //     //     console.log(err)
            //     // }
            // })
            socket.on('sendingMsg', async (val) => {
                try {
                    console.log("Processing message from user:", val);

                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                    const roomId = val.chat;
                    const participantId = val.chat.split("-#=#-").join('').split(user.id).join('');

                    // Save message to database
                    const msg = await prisma.message.create({
                        data: {
                            senderId: user.id,
                            receiverId: participantId,
                            roomId,
                            message: val.val,
                            img: val?.image
                        }
                    });

                    console.log("Message saved, broadcasting to room:", roomId);

                    // Broadcast to ALL users in room (including sender)
                    // This is the single source of truth for message display
                    SocketIOInstance.instance.to(roomId).emit('receiveMessage', msg);

                } catch (err) {
                    console.log("Error processing message:", err);
                    // Optionally emit error back to sender
                    socket.emit('messageError', { error: 'Failed to send message' });
                }
            });

            socket.on('activeUserSearchList', async (name) => {
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                    if (!name.trim()) {
                        socket.emit("activeUserList", []);
                        return;
                    }

                    // Search all users in DB
                    const users = await prisma.user.findMany({
                        where: {
                            name: {
                                contains: name,
                                mode: 'insensitive'
                            },
                            NOT: {
                                id: user.id
                            }
                        },
                        take: 10,
                        select: {
                            id: true,
                            name: true
                        }
                    });

                    // Map to the expected format if needed (activePreviousUserI expects name, id)
                    // The query already returns that format.
                    socket.emit("activeUserList", users);
                } catch (err) {
                    console.log("Error in activeUserSearchList:", err);
                    socket.emit("activeUserList", []);
                }
            })
            //SECTION - CHAT with AI event trying to user id
            socket.on("privateRoomWithAI", async ({ id, cChat }) => {
                try {
                    console.log("User id: ", id);
                    if (!id || id.length !== 24) {
                        console.log("Invalid ID for AI Chat:", id);
                        return;
                    }
                    const participantId = process.env.AI_BOT_ID || "";
                    if (!participantId || participantId.length !== 24) {
                        console.log("Invalid AI Bot ID:", participantId);
                        return;
                    }

                    const check = await prisma.room.findFirst({
                        where: { creatorId: id, participantId: participantId }
                    })
                    console.log("Chat with AI for user id: ", id, ": " + check?.room)
                    if (!check) {
                        const newRoom = await prisma.room.create({ data: { room: id + "-#=#-" + participantId, creatorId: id, participantId: participantId } })
                        socket.emit("joinRoom", { activeChat: newRoom.room, prevChat: cChat })
                        console.log("Chat with AI not found");
                    } else {
                        socket.emit("joinRoom", { activeChat: check.room, prevChat: cChat });
                        console.log("Chat with AI found");
                    }
                } catch (err) {
                    console.log(err);
                }
            })

            socket.on("privateRoom", async ({ cChat, id }) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                if (!id || id.length !== 24) {
                    console.log("Invalid ID for Private Room:", id);
                    return;
                }

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

            socket.on("deleteRoom", async (roomId) => {
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                    const room = await prisma.room.findUnique({ where: { room: roomId } });

                    if (!room) return;
                    if (room.creatorId !== user.id && room.participantId !== user.id) return;

                    await prisma.message.deleteMany({ where: { roomId: roomId } });
                    await prisma.room.delete({ where: { room: roomId } });

                    socket.emit("roomDeleted", roomId);
                    SocketIOInstance.instance.emit("room");
                } catch (e) {
                    console.log("Error deleting room:", e);
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