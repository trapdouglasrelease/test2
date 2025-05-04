const express = require("express");
const socketIO = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

const players = {};

io.on("connection", (socket) => {
    console.log("¡Nuevo jugador conectado!", socket.id);

    players[socket.id] = {
        x: Math.random() * 400,
        y: Math.random() * 400,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        id: socket.id
    };

    socket.emit("init", { 
        currentPlayer: players[socket.id],
        otherPlayers: players
    });

    socket.broadcast.emit("newPlayer", players[socket.id]);

    socket.on("playerMove", (newPosition) => {
        if (players[socket.id]) {
            players[socket.id].x = newPosition.x;
            players[socket.id].y = newPosition.y;
            socket.broadcast.emit("playerMoved", {
                id: socket.id,
                x: newPosition.x,
                y: newPosition.y
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("Jugador desconectado:", socket.id);
        delete players[socket.id];
        io.emit("playerDisconnected", socket.id);
    });
});

// ¡Línea corregida!
server.listen(3000, '0.0.0.0', () => {
    console.log("Servidor listo en http://0.0.0.0:3000");
});