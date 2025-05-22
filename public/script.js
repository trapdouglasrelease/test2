const MAP_RADIUS = 2000;
const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const chatInput = document.getElementById("chatInput");
let players = {};
let isChatOpen = false;

const headImage = new Image();
headImage.src = "assets/worm-head.png";

//const defaultBodyImage1 = new Image();
//defaultBodyImage1.src = "assets/worm-body1.png";

//const defaultBodyImage2 = new Image();
//defaultBodyImage2.src = "assets/worm-body2.png";

const DECORATION_DOTS = [];
const NUM_DOTS = 1000;

for (let i = 0; i < NUM_DOTS; i++) {
  let angle = Math.random() * Math.PI * 2;
  let radius = Math.random() * (MAP_RADIUS - 50); // deja margen
  let x = MAP_RADIUS + Math.cos(angle) * radius;
  let y = MAP_RADIUS + Math.sin(angle) * radius;
  DECORATION_DOTS.push({ x, y });
}

// 🖱️ Posición del mouse
let mouseX = 0;
let mouseY = 0;

// 🖱️ Seguir el movimiento del mouse
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Ajustar tamaño del canvas al cargar y redimensionar
function resizeCanvas() {
  // Ahora el canvas ocupa el 100% del viewport
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawPlayers(); // Redibuja si es necesario
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const player = players[socket.id];
  if (!player) return;

  const cameraX = player.x - canvas.width / 2;
  const cameraY = player.y - canvas.height / 2;

  ctx.fillStyle = "#182914"; // Verde suave tipo hoja
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = MAP_RADIUS - cameraX;
  const centerY = MAP_RADIUS - cameraY;
  ctx.beginPath();
  ctx.arc(centerX, centerY, MAP_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#e8f4f8"; // color del mapa (claro)
  ctx.fill();

  // Dibujar puntitos decorativos
  ctx.fillStyle = "#aaa";
  DECORATION_DOTS.forEach((dot) => {
    const dotX = dot.x - cameraX;
    const dotY = dot.y - cameraY;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  Object.values(players).forEach((p) => {
    const screenX = p.x - cameraX;
    const screenY = p.y - cameraY;

    if (headImage.complete && headImage.naturalWidth) {
      const scale = 0.25; // Ajustá esto si querés agrandar o achicar
      const width = headImage.naturalWidth * scale;
      const height = headImage.naturalHeight * scale;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(p.angle || 0);
      ctx.drawImage(headImage, -width / 2, -height / 2, width, height);
      ctx.restore();
    }

    // Nombre
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.name, screenX, screenY - 15);

    // Mensajes flotantes
    if (p.messages && p.messages.length > 0) {
      const messageTexts = [...p.messages].reverse().map((msg) => msg.text);
      const combinedText = messageTexts.join("\n");

      ctx.font = "15px Arial";
      ctx.textAlign = "center";

      const lineHeight = 14;
      const lines = combinedText.split("\n");
      const longestLine = lines.reduce(
        (a, b) => (a.length > b.length ? a : b),
        ""
      );
      const textWidth = ctx.measureText("" + longestLine).width;

      const padding = 8;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = lineHeight * lines.length + padding * 1.5;
      const x = screenX - boxWidth / 2;
      const y = screenY - boxHeight - 35;

      ctx.fillStyle = "rgba(0, 0, 0, 0.50)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.00)";
      ctx.lineWidth = 0;
      const radius = 4;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + boxWidth - radius, y);
      ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
      ctx.lineTo(x + boxWidth, y + boxHeight - radius);
      ctx.quadraticCurveTo(
        x + boxWidth,
        y + boxHeight,
        x + boxWidth - radius,
        y + boxHeight
      );
      ctx.lineTo(x + boxWidth / 2 + 6, y + boxHeight);
      ctx.lineTo(screenX, screenY - 25);
      ctx.lineTo(x + boxWidth / 2 - 6, y + boxHeight);
      ctx.lineTo(x + radius, y + boxHeight);
      ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#000";
      lines.forEach((line, i) => {
        ctx.fillText(
          "" + line,
          screenX,
          y + padding + (i + 1) * lineHeight - 4
        );
      });
    }
  });
}

function updatePlayerMovement() {
  const player = players[socket.id];
  if (!player) return;

  // Dirección desde el centro del canvas al mouse
  const dx = mouseX - canvas.width / 2;
  const dy = mouseY - canvas.height / 2;
  const angle = Math.atan2(dy, dx);
  player.angle = angle;

  const speed = 3; // Ajusta la velocidad aquí
  player.x += Math.cos(angle) * speed;
  player.y += Math.sin(angle) * speed;

  // Limitar dentro del mapa circular
  const distFromCenter = Math.sqrt(
    Math.pow(player.x - MAP_RADIUS, 2) + Math.pow(player.y - MAP_RADIUS, 2)
  );
  if (distFromCenter > MAP_RADIUS - 10) {
    const angleToCenter = Math.atan2(
      player.y - MAP_RADIUS,
      player.x - MAP_RADIUS
    );
    player.x = MAP_RADIUS + Math.cos(angleToCenter) * (MAP_RADIUS - 10);
    player.y = MAP_RADIUS + Math.sin(angleToCenter) * (MAP_RADIUS - 10);
  }

  // Enviar posición al servidor
  socket.emit("playerMove", {
    x: player.x,
    y: player.y,
    angle: angle,
  });
}

// Eventos del servidor
socket.on("init", (data) => {
  players = { ...data.otherPlayers, [socket.id]: data.currentPlayer };
  drawPlayers();
});

socket.on("newPlayer", (newPlayer) => {
  players[newPlayer.id] = newPlayer;
  drawPlayers();
});

socket.on("playerMoved", (data) => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
    players[data.id].angle = data.angle !== undefined ? data.angle : 0; // <--- guardar el ángulo
    drawPlayers();
  }
});

socket.on("messageSent", (data) => {
  if (players[data.id]) {
    players[data.id].messages = data.messages;
    drawPlayers();
  }
});

socket.on("messageUpdate", (data) => {
  if (players[data.id]) {
    players[data.id].messages = data.messages;
    drawPlayers();
  }
});

socket.on("playerDisconnected", (id) => {
  delete players[id];
  drawPlayers();
});

// Control del chat
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !isChatOpen) {
    e.preventDefault();
    chatInput.focus();
    isChatOpen = true;
  }
});

chatInput.addEventListener("focus", () => {
  isChatOpen = true;
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    if (chatInput.value.trim() !== "") {
      socket.emit("sendMessage", chatInput.value.trim());
      chatInput.value = "";
    }
    e.preventDefault();
    chatInput.blur();
    isChatOpen = false;
  }
});

document.addEventListener("click", (e) => {
  if (e.target !== chatInput && isChatOpen) {
    chatInput.blur();
    isChatOpen = false;
  }
});

socket.on("updateChatHistory", (messages) => {
  const chatHistoryDiv = document.getElementById("chatHistory");
  chatHistoryDiv.innerHTML = messages
    .slice() // copiar array para no mutarlo
    .reverse()
    .map((msg) => `<div><strong>${msg.playerName}:</strong> ${msg.text}</div>`)
    .join("");
  chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
});

function gameLoop() {
  updatePlayerMovement();
  drawPlayers();
  requestAnimationFrame(gameLoop);
}

gameLoop(); // ⏱️ ¡Iniciar el bucle de juego!
