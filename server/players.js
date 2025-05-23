const MAP_RADIUS = 2000;
const SEGMENT_SPACING = 20; // Distancia fija entre segmentos

const players = {};
let count = 0;

function addPlayer(id) {
  count++;
  const tailLength = 50;
  const tail = Array(tailLength)
    .fill(null)
    .map((_, i) => ({
      x: i * SEGMENT_SPACING, // Posiciones iniciales espaciadas
      y: 0,
    }));

  players[id] = {
    x: Math.random() * 400,
    y: Math.random() * 400,
    id,
    name: `Jugador${count}`,
    messages: [],
    tail,
  };
  return players[id];
}

function updatePosition(id, pos) {
  const p = players[id];
  if (!p) return;

  // 1. Calcular dirección del movimiento
  const angle = pos.angle || Math.atan2(pos.y - p.y, pos.x - p.x);

  // 2. Actualizar posición principal
  p.x = pos.x;
  p.y = pos.y;
  p.angle = angle;

  // 3. Mover toda la cuerda hacia adelante
  if (!p.tail)
    p.tail = Array(50)
      .fill(null)
      .map(() => ({ x: p.x, y: p.y }));

  // El primer segmento sigue exactamente al jugador
  p.tail[0] = { x: p.x, y: p.y };

  // Mover los demás segmentos manteniendo distancia constante
  for (let i = 1; i < p.tail.length; i++) {
    const prev = p.tail[i - 1];
    const dx = prev.x - p.tail[i].x;
    const dy = prev.y - p.tail[i].y;
    const dist = Math.hypot(dx, dy);

    if (dist > SEGMENT_SPACING) {
      const moveX = dx * 0.2; // Factor de suavizado
      const moveY = dy * 0.2;
      p.tail[i].x += moveX;
      p.tail[i].y += moveY;
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
