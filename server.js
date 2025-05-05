const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

const players = {};
let playerCount = 0;

io.on('connection', (socket) => {
    console.log('¡Nuevo jugador conectado!', socket.id);
    playerCount++;
    const playerName = `Jugador${playerCount}`;

    // Crear nuevo jugador
    players[socket.id] = {
        x: Math.random() * 400,
        y: Math.random() * 400,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        id: socket.id,
        name: playerName,
        messages: []
    };

    // Enviar TODOS los jugadores al nuevo conectado (incluyéndose)
    socket.emit('init', {
        currentPlayer: players[socket.id],
        otherPlayers: Object.fromEntries(
            Object.entries(players).filter(([id]) => id !== socket.id)
        )
    });

    // Notificar a los demás sobre el nuevo jugador
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMove', (newPosition) => {
        if (players[socket.id]) {
            players[socket.id].x = newPosition.x;
            players[socket.id].y = newPosition.y;
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: newPosition.x,
                y: newPosition.y
            });
        }
    });

    socket.on('sendMessage', (message) => {
        if (players[socket.id] && message.trim() !== '') {
            players[socket.id].messages.unshift({ // Usamos unshift para agregar al inicio
                text: message,
                timestamp: Date.now()
            });

            // Limitar a 2 mensajes máximo
            if (players[socket.id].messages.length > 2) {
                players[socket.id].messages.pop();
            }

            io.emit('messageSent', {
                id: socket.id,
                messages: players[socket.id].messages
            });

            setTimeout(() => {
                players[socket.id].messages = players[socket.id].messages.filter(
                    m => Date.now() - m.timestamp < 10000
                );
                io.emit('messageUpdate', {
                    id: socket.id,
                    messages: players[socket.id].messages
                });
            }, 10000);
        }
    });

    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        delete players[socket.id];
        playerCount--;
        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Servidor listo en http://0.0.0.0:3000');
});