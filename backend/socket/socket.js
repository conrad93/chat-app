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
const rooms = {};

io.on('connection', (socket) => {
    console.log("User connected ", socket.id);

    const userId = socket.handshake.query.userId;
    
    if(userId) {
        if(!userSocketMap[userId]) {
            userSocketMap[userId] = [];
        }
        userSocketMap[userId].push(socket.id);
    };

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    socket.on('joinRoom', (data) => handleJoinRoom(socket, data));
    socket.on('leaveRoom', (data) => handleLeaveRoom(socket, data));
    socket.on('signal', (data) => broadcastSignal(data));

    socket.on('disconnect', () => handleDisconnect(socket));
});

const handleJoinRoom = (socket, data) => {
    socket.join(data.roomId);

    if(!rooms[data.roomId]) rooms[data.roomId] = {participants: []};
    const participant = {userId: data.userId, socketId: socket.id};
    rooms[data.roomId].participants.push(participant);
    
    io.to(data.roomId).emit('roomJoined', {...data, participants: rooms[data.roomId]?.participants?.length});
};

const handleLeaveRoom = (socket, data) => {
    socket.leave(data.roomId);

    if(rooms[data.roomId]) {
        rooms[data.roomId].participants = rooms[data.roomId].participants.filter(p => p.socketId !== socket.id);
    }

    if(rooms[data.roomId]?.participants?.length === 0) {
        delete rooms[data.roomId];
    } else {
        io.to(data.roomId).emit('roomLeft', {...data, participants: rooms[data.roomId]?.participants?.length});
    }
};

const handleSignal = (data) => {
    const receiverSockets = userSocketMap[data.to];
    if(receiverSockets) {
        receiverSockets.forEach(socketId => {
            io.to(socketId).emit('signal', {from: data.from, signal: data.signal});
        });
    }
};

const broadcastSignal = (data) => {
    const room = rooms[data.roomId];
    if(room) {
        room.participants.forEach(p => {
            if(p.userId !== data.from) {
                const receiverSockets = userSocketMap[p.userId];
                if(receiverSockets) {
                    receiverSockets.forEach(socketId => {
                        io.to(socketId).emit('signal', {from: data.from, signal: data.signal});
                    });
                }
            }
        });
    } else {
        handleSignal(data);
    }
};

const handleDisconnect = (socket) => {
    console.log("User disconnected ", socket.id);

    const userId = Object.keys(userSocketMap).find(key => userSocketMap[key].includes(socket.id));
    if(userId) {
        userSocketMap[userId] = userSocketMap[userId].filter(s => s !== socket.id);
        if(userSocketMap[userId].length === 0) {
            delete userSocketMap[userId];
        }
    }

    for(const roomId in rooms) {
        rooms[roomId].participants = rooms[roomId].participants.filter(p => p.socketId !== socket.id);

        if(rooms[roomId].participants.length === 0) {
            delete rooms[roomId];
        } else {
            const userBelongsToRoom = rooms[roomId].participants.find(p => p.userId === userId);
            if(userBelongsToRoom) {
                io.to(roomId).emit('roomLeft', {roomId, userId, participants: rooms[roomId]?.participants?.length});
            }
        }
    }
};

const emitToUser = (userId, event, data) => {
    const receiverSockets = userSocketMap[userId];
    if(receiverSockets) {
        receiverSockets.forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
    }
};

module.exports = {app, server, io, emitToUser};