const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { userModel } = require('../models/user.model');
const { roomModel } = require('../models/room.model');
const { chatModel } = require('../models/chat.model')
require('dotenv').config();

let users = [];

let rooms = [];

module.exports= (server)=>{
    io = socketIO(server);
    io.on('connection', async (socket)=>{
        const token = socket.handshake.auth.token;
        let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        socket.handshake.auth.userId = decoded.userId;
        let user = await userModel.findById(decoded.userId);
        users.push({name: user.name, email: user.email})
        rooms = await roomModel.find();
        io.emit('roomList', rooms);
        io.emit('userList',users);
        socket.on('rList', async ()=>{
            try{
                // console.log('Event: rList');
                rooms = await roomModel.find();
                socket.emit('roomList',rooms);
            }catch(err){
                console.log(err.message);
            }
        })
        
        socket.on('joinRoom', async ({activeRoom, prevRoom})=>{
            if(prevRoom){
                console.log('leave will only work when he is already in a room');
                socket.leave(prevRoom)
            }
            socket.join(activeRoom);
            let msgList = await chatModel.find({'room': activeRoom});
            io.to(activeRoom).emit('welcome', ({activeRoom, msgList, user}));
        })

        socket.on('createRoom', async (room)=>{
            try{
                // console.log('Event: createRoom');
                let newRoom = new roomModel({room});
                await newRoom.save();
                io.emit('nroom');
            }catch(err){
                console.log(err.message);
            }
        })

        socket.on('msgSent', async (obj)=>{
            try{
                let {msg, activeRoom} = obj;
                let newMsg = new chatModel({msg, 'room': activeRoom, userId: user._id});
                await newMsg.save();
                io.to(activeRoom).emit('receiveMsg', newMsg)
            }catch(err){
                console.log(err.message);
            }
        })

        socket.on('disconnect', async ()=>{
            // console.log('Event: disconnect');
            const userId = socket.handshake.auth.userId;
            let person = await userModel.findById(userId);
            users = users.filter((el)=> el.email!=person.email);
            io.emit('userList', users);
        })
    })
}