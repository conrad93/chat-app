const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:4200"],
        method: ["GET", "POST"]
    }
});

const userSocketMap = {};

io.on('connection', (socket) => {
    console.log("User connected ", socket.id);

    const userId = socket.handshake.query.userId;
    
    if(userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    socket.on('joinRoom', (data) => {
        socket.join(data.roomId);
        
        io.to(data.roomId).emit('roomJoined', data);
    });

    socket.on('leaveRoom', (data) => {
        socket.leave(data.roomId);
    
        io.to(data.roomId).emit('roomLeft', data);
    });

    socket.on('signal', (data) => {
        let receiverSocketId = getReceiverSocketId(data.to);
        if(receiverSocketId) io.to(receiverSocketId).emit('signal', { from: data.from, signal: data.signal });
    });

    socket.on('disconnect', () => {
        console.log("User disconnected ", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
}

module.exports = {app, server, io, getReceiverSocketId};