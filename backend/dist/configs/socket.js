"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socket_io_1 = require("socket.io");
const prismaInstance_1 = __importDefault(require("../configs/prismaInstance"));
const userUpdater = (arr, user) => {
    let present = arr.find((el) => el.id === user.id);
    if (!present)
        arr.push(user);
};
;
exports.default = (server) => {
    const io = new socket_io_1.Server(server);
    let onlineUser = [];
    io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const token = socket.handshake.auth.token;
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, (process.env.JWT_SECRET_KEY || ""));
            userUpdater(onlineUser, { id: decoded.id, name: decoded.name });
        }
        catch (err) {
            console.log(err);
            socket.emit("loginAgain");
        }
        socket.emit('message', "Hello From Server");
        socket.on('disconnect', () => {
            if (!token)
                return;
            onlineUser = onlineUser.filter((el) => el.id !== decoded.id);
        });
        socket.on('sendingMsg', (val) => __awaiter(void 0, void 0, void 0, function* () {
            const user = jsonwebtoken_1.default.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || ""));
            const roomId = val.chat;
            const participantId = val.chat.split("-#=#-").join('').split(user.id).join('');
            const msg = yield prismaInstance_1.default.message.create({
                data: {
                    senderId: user.id,
                    receiverId: participantId,
                    roomId, message: val.val,
                    img: val === null || val === void 0 ? void 0 : val.image
                }
            });
            io.to(roomId).emit('receiveMessage', msg);
        }));
        socket.on('activeUserSearchList', (name) => {
            const user = jsonwebtoken_1.default.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || ""));
            let searchList = onlineUser.filter(el => el.name.toLowerCase().includes(name.toLowerCase()));
            searchList = searchList.filter(el => el.name !== user.name);
            socket.emit("activeUserList", searchList);
        });
        socket.on("privateRoom", ({ cChat, id }) => __awaiter(void 0, void 0, void 0, function* () {
            const user = jsonwebtoken_1.default.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || ""));
            const check = yield prismaInstance_1.default.room.findFirst({
                where: {
                    OR: [
                        { creatorId: user.id, participantId: id },
                        { creatorId: id, participantId: user.id }
                    ]
                }
            });
            if (!check) {
                const newRoom = yield prismaInstance_1.default.room.create({ data: { room: user.id + '-#=#-' + id, creatorId: user.id, participantId: id } });
                io.emit("room");
                socket.emit('joinRoom', { activeChat: newRoom.room, prevChat: cChat });
            }
            else
                socket.emit('joinRoom', { activeChat: check.room, prevChat: cChat });
        }));
        socket.on("joiningRoom", (data) => {
            if (data.prevChat) {
                socket.leave(data.prevChat);
            }
            socket.join(data.activeChat);
            socket.emit('joinedRoom', data.activeChat);
        });
        socket.on("privateMessages", (chat) => __awaiter(void 0, void 0, void 0, function* () {
            const user = jsonwebtoken_1.default.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || ""));
            if (chat.includes(user.id)) {
                const messages = yield prismaInstance_1.default.message.findMany({ where: { roomId: chat } });
                socket.emit("receiveMessages", { id: user.id, messages });
            }
        }));
        socket.on("deleteMessage", ({ msgId, senderId, roomId }) => __awaiter(void 0, void 0, void 0, function* () {
            const user = jsonwebtoken_1.default.verify(socket.handshake.auth.token, (process.env.JWT_SECRET_KEY || ""));
            if (senderId !== user.id)
                return;
            try {
                const checkmsg = yield prismaInstance_1.default.message.findUnique({ where: { senderId, id: msgId } });
                if (checkmsg) {
                    yield prismaInstance_1.default.message.delete({ where: { id: checkmsg.id } });
                }
                io.to(roomId).emit("DeletedMessage", msgId);
            }
            catch (er) {
                console.log(er);
            }
        }));
        socket.on("leaveRoom", (cChat) => {
            socket.emit("RoomLeaved");
        });
    }));
};
