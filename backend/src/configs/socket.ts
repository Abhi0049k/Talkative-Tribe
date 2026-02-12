import jwt, { JwtPayload } from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import prisma from '../configs/prismaInstance';
import { DecodedUser } from "@mangalam0049k/common";
import { chatWithAI } from './ai/controllers';
import fs from "fs";
import path from "path";

export interface MessageIdSenderIdI { msgId: string; senderId: string; roomId: string; };

// Parse allowed origins from environment variable
const FRONTEND_SERVER_URL = process.env.FRONTEND_SERVER_URL || "http://localhost:5173";
const allowedOrigins = FRONTEND_SERVER_URL.split(',').map(origin => origin.trim());

let cnt = 0;

class SocketIOInstance {
    private static instance: Server;
    private static onlineUser: DecodedUser[] = [];
    // Map<CommunityId, Map<UserId, {socketId: string, name: string}>>
    private static activeCallParticipants: Map<string, Map<string, { socketId: string, name: string }>> = new Map();
    // Map<CommunityId, Set<UserId>> - Tracks unique participants for current call session for summary
    private static callUniqueParticipants: Map<string, Set<string>> = new Map();

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

                // Join personal room for direct targeting (Calling, Notifications)
                socket.join(decoded.id);
                console.log(`User ${decoded.name} (${decoded.id}) joined personal room`);

                // Join all community rooms for notifications
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: decoded.id },
                        select: { joinedCommunityIds: true }
                    });

                    if (dbUser && dbUser.joinedCommunityIds) {
                        dbUser.joinedCommunityIds.forEach(id => {
                            socket.join(id);
                        });
                        console.log(`User auto-joined ${dbUser.joinedCommunityIds.length} community rooms`);
                    }
                } catch (e) {
                    console.error("Error joining community rooms:", e);
                }

            } catch (err) {
                console.log(err);
                socket.emit("loginAgain")
            }
            socket.emit('message', "Hello From Server")

            socket.on('disconnect', () => {
                if (!token) return;
                SocketIOInstance.onlineUser = SocketIOInstance.onlineUser.filter((el) => el.id !== decoded.id);

                // Cleanup calls with unified logic
                SocketIOInstance.activeCallParticipants.forEach((participants, communityId) => {
                    if (participants.has(decoded.id)) {
                        SocketIOInstance.handleParticipantLeave(communityId, decoded.id);
                    }
                });
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

            // Community Socket Events
            socket.on("joinCommunityRoom", async ({ communityId }) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                if (await SocketIOInstance.isMember(user.id, communityId)) {
                    console.log(`User joining community room: ${communityId}`);
                    socket.join(communityId);
                } else {
                    console.log(`Access denied: User ${user.id} tried to join community ${communityId} without membership`);
                    socket.emit("error", { message: "Access denied: You are not a member of this community" });
                }
            });

            socket.on("leaveCommunityRoom", ({ communityId }) => {
                console.log(`User leaving community room: ${communityId}`);
                socket.leave(communityId);
            });

            // Community Call Signaling Events
            // Community Call Signaling Events
            socket.on("leaveCommunityCall", async ({ communityId, peerId }) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                // Verify membership? Or just trust peerId match?
                // Ideally check membership.
                if (await SocketIOInstance.isMember(user.id, communityId)) {
                    await SocketIOInstance.handleParticipantLeave(communityId, peerId || user.id);
                }
            });

            // Community Call WebRTC Signaling (Duplicates removed - see correct unicast handlers below)


            socket.on("sendCommunityMessage", async (val) => {
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                    const { communityId, message, image, title, type, media, repostId, replyToId, isAnonymous } = val;

                    if (!(await SocketIOInstance.isMember(user.id, communityId))) {
                        socket.emit('messageError', { error: 'Access denied: You are not a member' });
                        return;
                    }

                    // Validate Anonymity Permission
                    const community = await prisma.community.findUnique({ where: { id: communityId } });
                    if (!community) return;

                    let finalIsAnonymous = isAnonymous || false;

                    if (finalIsAnonymous) {
                        if (type === "POST" && !community.allowAnonymousPosts) {
                            finalIsAnonymous = false; // Forced to non-anonymous if not allowed
                        } else if ((type === "MESSAGE" || !type) && !community.allowAnonymousMessages) {
                            finalIsAnonymous = false;
                        }
                    }

                    const msg = await prisma.communityMessage.create({
                        data: {
                            senderId: user.id,
                            communityId: communityId,
                            message: message,
                            img: image,
                            title: title || null,
                            type: type || "MESSAGE", // Default to MESSAGE
                            media: media || [],
                            repostId: repostId || null,
                            replyToId: replyToId || null,
                            isAnonymous: finalIsAnonymous
                        },
                        include: {
                            sender: { select: { id: true, name: true, image: true } },
                            repost: { include: { sender: { select: { id: true, name: true } } } },
                            replyTo: { include: { sender: { select: { id: true, name: true } } } },
                            likes: true
                        }
                    });

                    // 1. Emit to SENDER (User sees their own message as NORMAL, so 'yours' works)
                    socket.emit("receiveCommunityMessage", msg);

                    // 2. Emit to OTHERS (Sanitized if anonymous)
                    const broadcastMsg = { ...msg };
                    if (finalIsAnonymous) {
                        broadcastMsg.sender = {
                            id: "anonymous",
                            name: "Anonymous",
                            image: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                        } as any;
                        // Important: We should NOT change top-level senderId on the object if frontend relies on 'yours' logic coupled with token
                        // BUT since this is for OTHERS, senderId !== their userId anyway.
                        // However, if we change senderId to 'anonymous', it's cleaner.
                        // Let's rely on 'sender' object for display.
                    }

                    // socket.to(room) broadcasts to everyone in the room EXCEPT the sender
                    socket.to(communityId).emit("receiveCommunityMessage", broadcastMsg);
                } catch (err) {
                    console.log("Error processing community message:", err);
                    socket.emit('messageError', { error: 'Failed to send community message' });
                }
            });

            socket.on("likePost", async ({ msgId, communityId }) => {
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                    // Upsert like
                    await prisma.like.create({
                        data: {
                            userId: user.id,
                            communityMessageId: msgId
                        }
                    }).catch(() => { }); // If exists (duplicate), ignore

                    const updatedMsg = await prisma.communityMessage.findUnique({
                        where: { id: msgId },
                        include: {
                            sender: { select: { id: true, name: true, image: true } },
                            repost: { include: { sender: { select: { id: true, name: true } } } },
                            replyTo: { include: { sender: { select: { id: true, name: true } } } },
                            likes: true
                        }
                    });

                    SocketIOInstance.instance.to(communityId).emit("receiveCommunityMessageUpdate", updatedMsg);

                } catch (err) {
                    console.log("Error liking post:", err);
                }
            });

            socket.on("unlikePost", async ({ msgId, communityId }) => {
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                    await prisma.like.deleteMany({
                        where: {
                            userId: user.id,
                            communityMessageId: msgId
                        }
                    });

                    const updatedMsg = await prisma.communityMessage.findUnique({
                        where: { id: msgId },
                        include: {
                            sender: { select: { id: true, name: true, image: true } },
                            repost: { include: { sender: { select: { id: true, name: true } } } },
                            replyTo: { include: { sender: { select: { id: true, name: true } } } },
                            likes: true
                        }
                    });

                    SocketIOInstance.instance.to(communityId).emit("receiveCommunityMessageUpdate", updatedMsg);

                } catch (err) {
                    console.log("Error unliking post:", err);
                }
            });

            socket.on("deleteCommunityMessage", async ({ msgId, communityId }) => {
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                    const checkmsg = await prisma.communityMessage.findUnique({ where: { id: msgId } });

                    if (checkmsg && checkmsg.senderId === user.id) {
                        // Delete media files
                        if (checkmsg.media && checkmsg.media.length > 0) {
                            checkmsg.media.forEach((filePath: string) => {
                                // Assuming filePath is relative like /uploads/filename
                                const absolutePath = path.join(__dirname, "../..", filePath); // Adjust path to root/backend
                                if (fs.existsSync(absolutePath)) {
                                    fs.unlinkSync(absolutePath);
                                }
                            });
                        }

                        await prisma.communityMessage.delete({ where: { id: msgId } });
                        SocketIOInstance.instance.to(communityId).emit("deletedCommunityMessage", msgId);
                    }
                } catch (err) {
                    console.log("Error deleting community message:", err);
                }
            });

            // WebRTC Signaling Events
            socket.on("startCommunityCall", async ({ communityId, type }) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                if (await SocketIOInstance.isMember(user.id, communityId)) {
                    console.log(`📞 Community call started in ${communityId} by ${user.name}`);

                    let callId = `call-${Date.now()}`;
                    let startedAt = new Date().toISOString();

                    // Initialize unique participant tracking
                    SocketIOInstance.callUniqueParticipants.set(communityId, new Set([user.id]));

                    // Create Call Record (Try/Catch to avoid crashing if Schema update isn't live)
                    // Force restart for Prisma Client update
                    try {
                        const newCall = await prisma.call.create({
                            data: {
                                communityId,
                                callerId: user.id,
                                type,
                                status: "ONGOING"
                            }
                        });
                        callId = newCall.id;
                        startedAt = newCall.startedAt.toISOString();
                    } catch (e) {
                        console.error("Failed to create Call record (Schema might need reload):", e);
                    }

                    // Create Persistent System Message for Call Start
                    try {
                        const callMsg = await prisma.communityMessage.create({
                            data: {
                                communityId,
                                senderId: user.id,
                                message: "Started a call",
                                type: "CALL_STARTED",
                                title: type,
                                media: []
                            },
                            include: {
                                sender: { select: { id: true, name: true, image: true } },
                                repost: { include: { sender: { select: { id: true, name: true } } } },
                                replyTo: { include: { sender: { select: { id: true, name: true } } } },
                                likes: true
                            }
                        });

                        // Broadcast the message to the chat view so it appears in history
                        // Using instance.to ensures it goes to everyone including the sender
                        SocketIOInstance.instance.to(communityId).emit("receiveCommunityMessage", callMsg);

                    } catch (msgError) {
                        console.error("Failed to create/send Call Message:", msgError);
                    }

                    // Broadcast call invitation to all community members (except caller)
                    socket.to(communityId).emit("communityCallInvitation", {
                        communityId,
                        communityName: await SocketIOInstance.getCommunityName(communityId),
                        callerId: user.id,
                        callerName: user.name,
                        callType: type,
                        callId: callId,
                        timestamp: startedAt
                    });

                    // Also send back to caller to show they started the call
                    socket.emit("communityCallStarted", {
                        communityId,
                        callerId: user.id,
                        callerName: user.name,
                        type,
                        callId: callId
                    });
                }
            });

            socket.on("joinCommunityCall", async ({ communityId, peerId, username }) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                // Allow join if it's a valid community OR a valid Direct Call Room involving the user
                const isDirectRoom = communityId.includes("-#=#-");
                const isAuthorized = isDirectRoom
                    ? communityId.includes(user.id)
                    : await SocketIOInstance.isMember(user.id, communityId);

                if (isAuthorized) {
                    console.log(`👋 User ${username} (${peerId}) joined call in ${communityId} (Direct: ${isDirectRoom})`);

                    // Subscribe socket to community room if not already
                    socket.join(communityId);

                    // Add to active participants list
                    if (!SocketIOInstance.activeCallParticipants.has(communityId)) {
                        SocketIOInstance.activeCallParticipants.set(communityId, new Map());
                    }
                    // Track unique participants for summary
                    if (!SocketIOInstance.callUniqueParticipants.has(communityId)) {
                        SocketIOInstance.callUniqueParticipants.set(communityId, new Set());
                    }
                    SocketIOInstance.callUniqueParticipants.get(communityId)?.add(user.id);

                    const roomParticipants = SocketIOInstance.activeCallParticipants.get(communityId)!;

                    roomParticipants.set(peerId, {
                        socketId: socket.id,
                        name: username
                    });

                    // Send list of EXISTING participants to the new user so they can initiate connections
                    const existingParticipants = Array.from(roomParticipants.entries())
                        .filter(([id]) => id !== peerId) // Exclude self
                        .map(([id, data]) => ({
                            peerId: id,
                            username: data.name
                        }));

                    // Also get dynamic list including the new user (for sync)
                    const allCurrentParticipants = Array.from(roomParticipants.entries())
                        .map(([id, data]) => ({
                            peerId: id,
                            username: data.name
                        }));

                    // Notify existing participants about new participant
                    // AND provide full list for self-healing
                    socket.to(communityId).emit("communityCallParticipantJoined", {
                        communityId,
                        peerId: peerId,
                        username: username,
                        activeParticipants: allCurrentParticipants
                    });

                    socket.emit("existingCallParticipants", {
                        participants: existingParticipants
                    });

                } else {
                    console.log(`❌ Access denied: User ${user.id} tried to join call ${communityId} without authorization`);
                    socket.emit("error", { message: "Access denied: You are not authorized for this call" });
                }
            });

            socket.on("communityCallOffer", ({ communityId, to, offer, from }) => {
                const participants = SocketIOInstance.activeCallParticipants.get(communityId);
                const senderName = participants?.get(from)?.name || "User";

                socket.to(to).emit("communityCallOffer", {
                    communityId,
                    offer,
                    from,
                    username: senderName
                });
            });

            socket.on("communityCallAnswer", ({ communityId, to, answer, from }) => {
                socket.to(to).emit("communityCallAnswer", {
                    communityId,
                    answer,
                    from
                });
            });

            socket.on("communityCallIceCandidate", ({ communityId, to, candidate, from }) => {
                socket.to(to).emit("communityCallIceCandidate", {
                    communityId,
                    candidate,
                    from
                });
            });

            socket.on("endCommunityCall", async ({ communityId }) => {
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;
                if (await SocketIOInstance.isMember(user.id, communityId)) {
                    // Using handleParticipantLeave with Host ID forces termination
                    await SocketIOInstance.handleParticipantLeave(communityId, user.id);
                }
            });

            socket.on("callUser", async ({ userToCall, signalData, from, name }) => {
                // NATIVE WEBRTC: Enhanced call handling for direct calls
                const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                // Determine call type from signal (video/voice)
                // If signal doesn't have SDP (new flow), rely on explicit type or default
                const callType = signalData?.callType || (signalData?.sdp?.includes('m=video') ? 'video' : 'voice');

                const ids = [user.id, userToCall].sort();
                const roomId = ids.join("-#=#-");

                // Create Call Record for 1:1
                // Log 1:1 Call in Chat
                try {
                    await prisma.call.create({
                        data: {
                            callerId: user.id,
                            receiverId: userToCall,
                            type: callType,
                            status: "ONGOING"
                        }
                    });

                    // Check if room exists first
                    const roomExists = await prisma.room.findUnique({ where: { room: roomId } });
                    if (roomExists) {
                        const msg = await prisma.message.create({
                            data: {
                                senderId: user.id,
                                receiverId: userToCall,
                                roomId: roomId,
                                message: `📞 ${callType === 'video' ? 'Video' : 'Voice'} Call Started`
                            }
                        });
                        SocketIOInstance.instance.to(roomId).emit('receiveMessage', msg);
                    }

                } catch (e) {
                    console.error("Failed to create Call record/log 1:1:", e);
                }

                socket.to(userToCall).emit("callUser", {
                    signal: signalData,
                    from: from,
                    name: name,
                    callerId: user.id,
                    roomId: roomId,
                    callType: callType
                });
            });

            // CRITICAL FIX: Handle call answer (WebRTC answer signal forwarding)
            socket.on("answerCall", ({ signal, to }) => {
                console.log("📞 Forwarding call answer to caller:", to);
                socket.to(to).emit("callAccepted", signal);
            });

            socket.on("endCall", async ({ to }) => {
                // NATIVE WEBRTC: Notify other user that call ended
                console.log("🔴 Forwarding call end notification to:", to);

                // Update Call Status and Log
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                    // Update ongoing call status
                    await prisma.call.updateMany({
                        where: {
                            OR: [
                                { callerId: user.id, receiverId: to },
                                { callerId: to, receiverId: user.id }
                            ],
                            status: "ONGOING"
                        },
                        data: {
                            status: "ENDED",
                            endedAt: new Date()
                        }
                    });

                    // Insert End Call Log
                    const ids = [user.id, to].sort();
                    const roomId = ids.join("-#=#-");

                    const roomExists = await prisma.room.findUnique({ where: { room: roomId } });
                    if (roomExists) {
                        const msg = await prisma.message.create({
                            data: {
                                senderId: user.id,
                                receiverId: to,
                                roomId: roomId,
                                message: "🔴 Call Ended"
                            }
                        });
                        SocketIOInstance.instance.to(roomId).emit('receiveMessage', msg);
                    }

                } catch (e) { console.error("Error updating 1:1 call status/log:", e); }

                socket.to(to).emit("callEnded");
            });

            socket.on("getCommunityMessages", async (communityId) => {
                try {
                    const user = jwt.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || "")) as JwtPayload;

                    if (!(await SocketIOInstance.isMember(user.id, communityId))) {
                        return; // Silent fail or emit error
                    }

                    const messages = await prisma.communityMessage.findMany({
                        where: { communityId },
                        include: {
                            sender: { select: { id: true, name: true, image: true } },
                            repost: { include: { sender: { select: { id: true, name: true } } } },
                            replyTo: { include: { sender: { select: { id: true, name: true } } } },
                            likes: true
                        }
                    });

                    // Sanitize messages for anonymity
                    const sanitizedMessages = messages.map(msg => {
                        if (msg.isAnonymous && msg.senderId !== user.id) {
                            return {
                                ...msg,
                                sender: {
                                    id: "anonymous",
                                    name: "Anonymous",
                                    image: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                }
                            };
                        }
                        return msg;
                    });

                    socket.emit("receiveCommunityMessages", { id: user.id, messages: sanitizedMessages });
                } catch (err) {
                    console.log("Error fetching community messages:", err);
                }
            });

            socket.on("leaveRoom", (cChat) => {
                socket.emit("RoomLeaved")
            })
        })
    }

    private static async isMember(userId: string, communityId: string): Promise<boolean> {
        if (!userId || !communityId) return false;
        try {
            const count = await prisma.community.count({
                where: {
                    id: communityId,
                    memberIds: { has: userId }
                }
            });
            return count > 0;
        } catch (e) {
            console.error("Membership check failed", e);
            return false;
        }
    }

    private static async getCommunityName(communityId: string): Promise<string> {
        try {
            const community = await prisma.community.findUnique({
                where: { id: communityId },
                select: { name: true }
            });
            return community?.name || "Unknown Community";
        } catch (e) {
            console.error("Failed to get community name", e);
            return "Unknown Community";
        }
    }

    private static userUpdater(onlineUser: DecodedUser[], user: DecodedUser) {
        const index = onlineUser.findIndex((u) => u.id === user.id);
        if (index > -1) {
            onlineUser[index] = user;
        } else {
            onlineUser.push(user);
        }
    }

    // Centralized Leave Handler (Handles Disconnects & Manual Leaves)
    private static async handleParticipantLeave(communityId: string, peerId: string) {
        // console.log(`👋 Handling leave for ${peerId} in ${communityId}`);
        const participants = SocketIOInstance.activeCallParticipants.get(communityId);

        if (participants && participants.has(peerId)) {
            participants.delete(peerId);

            // Notify other participants
            SocketIOInstance.instance.to(communityId).emit("communityCallParticipantLeft", {
                communityId,
                peerId: peerId
            });

            // LOGIC: End call if Empty OR if Host Left
            let shouldEndCall = participants.size === 0;
            let ongoingCall = null;

            // Fetch call info if needed (to check host)
            try {
                ongoingCall = await prisma.call.findFirst({
                    where: { communityId, status: "ONGOING" },
                    include: { caller: { select: { id: true, name: true } } }
                });

                if (ongoingCall && ongoingCall.callerId === peerId) {
                    shouldEndCall = true;
                    console.log(`👑 Host (${peerId}) left community call in ${communityId}. Forcing end.`);
                }
            } catch (err) {
                console.error("Error fetching ongoing call for leave check:", err);
            }

            if (shouldEndCall) {
                if (participants.size === 0) {
                    console.log(`🏁 Last participant left community call in ${communityId}. Ending call.`);
                }

                // Clear memory state immediately
                SocketIOInstance.activeCallParticipants.delete(communityId);
                const uniqueParticipantsCount = SocketIOInstance.callUniqueParticipants.get(communityId)?.size || 0;
                SocketIOInstance.callUniqueParticipants.delete(communityId);

                if (ongoingCall) {
                    try {
                        let duration = "0s";

                        const startedAt = new Date(ongoingCall.startedAt);
                        const endedAt = new Date();
                        const diffMs = endedAt.getTime() - startedAt.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffSecs = Math.floor((diffMs % 60000) / 1000);

                        if (diffMins > 60) {
                            const diffHours = Math.floor(diffMins / 60);
                            const remainingMins = diffMins % 60;
                            duration = `${diffHours}h ${remainingMins}m`;
                        } else if (diffMins > 0) {
                            duration = `${diffMins}m ${diffSecs}s`;
                        } else {
                            duration = `${diffSecs}s`;
                        }

                        // Update DB
                        await prisma.call.updateMany({
                            where: { communityId, status: "ONGOING" },
                            data: {
                                status: "ENDED",
                                endedAt: new Date(),
                                participantCount: uniqueParticipantsCount
                            }
                        });

                        // Persist Summary Message
                        const summaryData = JSON.stringify({
                            callerName: ongoingCall.caller.name,
                            duration,
                            participantCount: uniqueParticipantsCount,
                            endedAt: new Date().toISOString()
                        });

                        const callEndMsg = await prisma.communityMessage.create({
                            data: {
                                communityId,
                                senderId: peerId, // The person who triggered end (Host or Last Leaver)
                                message: summaryData,
                                type: "CALL_ENDED",
                                title: "Call Summary",
                                media: []
                            },
                            include: {
                                sender: { select: { id: true, name: true, image: true } },
                                repost: { include: { sender: { select: { id: true, name: true } } } },
                                replyTo: { include: { sender: { select: { id: true, name: true } } } },
                                likes: true
                            }
                        });

                        SocketIOInstance.instance.to(communityId).emit("receiveCommunityMessage", callEndMsg);
                        SocketIOInstance.instance.to(communityId).emit("communityCallEnded", { communityId });

                    } catch (e) {
                        console.error("Failed to perform end call tasks:", e);
                    }
                }
            }
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