const players = require("./players");
const chat = require("./chat");

function handleConnection(socket, io) {
  console.log("¡Nuevo jugador conectado!", socket.id);
  const player = players.addPlayer(socket.id);
  socket.emit("init", {
    currentPlayer: player,
    otherPlayers: players.getAllExcept(socket.id),
  });
  socket.broadcast.emit("newPlayer", player);

  socket.on("playerMove", (pos) => {
    players.updatePosition(socket.id, pos);
    socket.broadcast.emit("playerMoved", { id: socket.id, ...pos });
  });

  socket.on("sendMessage", (msg) => {
    const result = chat.handleMessage(socket.id, msg, players, io); // pasamos io aquí
    if (result) {
      io.emit("messageSent", {
        id: socket.id,
        messages: result.messages,
      });
      io.emit("updateChatHistory", result.chatHistory);
    }
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    players.removePlayer(socket.id);
    socket.broadcast.emit("playerDisconnected", socket.id);
  });
}

module.exports = { handleConnection };
