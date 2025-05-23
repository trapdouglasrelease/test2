const MAP_RADIUS = 2000;
const players = {};
let count = 0;

function addPlayer(id) {
  count++;
  const tailLength = 50; // número de segmentos de cola
  const tail = Array(tailLength)
    .fill(null)
    .map(() => ({ x: 0, y: 0 }));

  players[id] = {
    x: Math.random() * 400,
    y: Math.random() * 400,
    id,
    name: `Jugador${count}`,
    messages: [],
    tail, // ✅ ahora sí se envía al cliente
  };

  return players[id];
}

function getAllExcept(excludedId) {
  return Object.fromEntries(
    Object.entries(players).filter(([id]) => id !== excludedId)
  );
}

function updatePosition(id, pos) {
  if (players[id]) {
    players[id].x = pos.x;
    players[id].y = pos.y;
    if (pos.angle !== undefined) {
      players[id].angle = pos.angle;
    }
  }
}

function removePlayer(id) {
  delete players[id];
  count--;
}

function getPlayer(id) {
  return players[id];
}

module.exports = {
  addPlayer,
  getAllExcept,
  updatePosition,
  removePlayer,
  getPlayer,
};
