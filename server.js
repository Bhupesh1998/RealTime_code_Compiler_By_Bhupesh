import express from 'express'
const app = express();
import http from 'http'
import path from 'path'
import { Server } from 'socket.io';
import ACTIONS from './src/Actions.js';
import cors from 'cors'
import { fileURLToPath } from 'url';

import os from 'os'
const networkInterfaces = os.networkInterfaces();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://realtime-code-editor-7l20.onrender.com/",
        methods: ["GET", "POST"]
    }
});
app.use(express.static("dist"));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
    // res.sendFile(path.join(__dirname, "public", "index.html"));
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}


io.on("connection", (socket) => {

    console.log("socket connected", socket.id);
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SEND_MESSAGE, ({ roomId, message }) => {
        socket.in(roomId).emit(ACTIONS.SEND_MESSAGE, { message });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on("disconnecting", () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5001;

// server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const getLocalIP = () => {
    for (const interfaceDetails of Object.values(networkInterfaces)) {
        for (const iface of interfaceDetails) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
};


server.listen(PORT, '0.0.0.0', () => {
    // console.log(`Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Server running at http://${getLocalIP()}:${PORT}`);

});