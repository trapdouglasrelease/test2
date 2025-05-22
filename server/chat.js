const chatHistory = [];

function handleMessage(id, text, players, io) {
  const trimmed = text.trim();
  const player = players.getPlayer(id);
  if (!player || !trimmed) return null;

  const timestamp = Date.now();
  const msg = {
    id,
    text: trimmed,
    playerName: player.name,
    timestamp,
  };

  player.messages.unshift({ text: trimmed, timestamp });
  if (player.messages.length > 10) player.messages.pop();

  chatHistory.push(msg);
  if (chatHistory.length > 20) chatHistory.shift();

  // Programar limpieza y aviso solo para ESTE mensaje
  setTimeout(() => {
    player.messages = player.messages.filter(
      (m) => Date.now() - m.timestamp < 10000
    );

    // Avisar a todos clientes que este jugador actualizó mensajes
    io.emit("messageUpdate", {
      id,
      messages: player.messages,
    });
  }, 10000);

  return {
    messages: player.messages,
    chatHistory: chatHistory.slice(-20),
  };
}

module.exports = { handleMessage };
