const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { userModel } = require('../models/user.model');
const { roomModel } = require('../models/room.model');
const { chatModel } = require('../models/chat.model');
const { blacklistModel } = require('../models/blacklist.model');
require('dotenv').config();

let users = [];

let rooms = [];

module.exports= (server)=>{
    io = socketIO(server);
    io.on('connection', async (socket)=>{
        const token = socket.handshake.auth.token;
        let decoded;
        try{
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        }catch(err){
            socket.emit('LoginAgain');
            return;
        }
        socket.handshake.auth.userId = decoded.userId;
        let user = await userModel.findById(decoded.userId);
        users.push({name: user.name, email: user.email})
        rooms = await roomModel.find();
        io.emit('roomList', rooms);
        io.emit('userList',users);
        socket.on('rList', async ()=>{
            try{
                rooms = await roomModel.find();
                socket.emit('roomList',rooms);
            }catch(err){
                console.log('rList',err.message);
            }
        })
        
        socket.on('joinRoom', async ({activeRoom, prevRoom})=>{
            try{
                if(prevRoom){
                    socket.leave(prevRoom)
                }
                socket.join(activeRoom);
                let msgList = await chatModel.find({'room': activeRoom});
                io.to(activeRoom).emit('welcome', ({activeRoom, msgList, user}));
            }catch(err){
                console.log('joinRoom', err.message);
            }
        })

        socket.on('createRoom', async (room)=>{
            try{
                let newRoom = new roomModel({room: room.name, creatorId: room.userId});
                await newRoom.save();
                io.emit('nroom');
            }catch(err){
                console.log(err.message);
            }
        })

        socket.on('deleteMessage', async(obj)=>{
            try{
                const isPresent = await blacklistModel.findOne({token: obj.token});
                if(isPresent){
                    socket.emit('LoginAgain');
                    return;
                }
                let decoded;
                try{
                    decoded = jwt.verify(obj.token, process.env.JWT_SECRET_KEY);
                }catch(err){
                    console.log(err.message);
                    socket.emit('LoginAgain');
                    return;
                }
                let chat = await chatModel.findById({_id: obj.id});
                if(chat.userId!=decoded.userId){
                    socket.emit('LoginAgain', 'You are not authorized to delete this message.')
                }
                await chatModel.findByIdAndDelete(obj.id);
                let msgList = await chatModel.find({'room': obj.activeRoom});
                io.to(obj.activeRoom).emit('welcome', ({activeRoom: obj.activeRoom, msgList}));
            }catch(err){
                console.log('deleteMessage', err.message);
            }
        })

        socket.on('deleteRoom', async ({room, token})=>{
            try{
                const isPresent = await blacklistModel.findOne({token});
                if(isPresent) {
                    socket.emit('LoginAgain');
                    return;
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
                let roomToBeDeleted = await roomModel.findOne({room: room, creatorId: decoded.userId})
                await chatModel.deleteMany({room});
                await roomModel.findByIdAndDelete({_id: roomToBeDeleted._id});
                rooms = await roomModel.find();
                io.emit('roomDeleted', roomToBeDeleted)
                io.emit('roomList',rooms);
            }catch(err){
                console.log('deleteRoom', err.message);
            }
        })

        socket.on('msgSent', async (obj)=>{
            try{
                let {msg, activeRoom, username} = obj;
                let newMsg = new chatModel({msg, 'room': activeRoom, userId: user._id, username});
                await newMsg.save();
                io.to(activeRoom).emit('receiveMsg', newMsg)
            }catch(err){
                console.log('msgSent', err.message);
            }
        })

        socket.on('disconnect', async ()=>{
            try{
                const userId = socket.handshake.auth.userId;
                let person = await userModel.findById(userId);
                users = users.filter((el)=> el.email!=person.email);
                io.emit('userList', users);
            }catch(err){
                console.log('disconnect', err.message);
            }
        })
    })
}