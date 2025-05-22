const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const socketHandlers = require("./server/socketHandlers");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

// Conexión de sockets
io.on("connection", (socket) => {
  socketHandlers.handleConnection(socket, io);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
