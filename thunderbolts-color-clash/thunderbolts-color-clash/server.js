const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const RoomManager = require("./src/multiplayer/roomManager");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
const rooms = new RoomManager(io);

io.on("connection", socket => {
  socket.on("createRoom", ({name, maxPlayers=10}) => rooms.createRoom(socket, name, maxPlayers));
  socket.on("joinRoom", ({name, code}) => rooms.joinRoom(socket, name, code));
  socket.on("startGame", () => rooms.startGame(socket));
  socket.on("playCard", ({cardId, chosenColor}) => rooms.playCard(socket, cardId, chosenColor));
  socket.on("drawCard", () => rooms.drawCard(socket));
  socket.on("callUno", () => rooms.callUno(socket));
  socket.on("catchUno", () => rooms.catchUno(socket));
  socket.on("disconnect", () => rooms.disconnect(socket));
});

server.listen(PORT, "0.0.0.0", () => console.log(`ThunderBolts Color Clash: http://localhost:${PORT}`));