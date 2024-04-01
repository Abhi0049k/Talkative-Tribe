import http from 'http';
import { Server } from 'socket.io';

export default (server: http.Server) => {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('A user Connected');
        socket.emit('message', "Hello From Server")
    })
}