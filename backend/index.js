const express = require("express");
const http = require("http");
const cors = require("cors");
const { CONFIG } = require("./src/config");
const index = require("./src/routes/index");

const app = express();
app.use(cors());
app.use(index);

const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// number of players in a room
const game = {
  rooms: [],
};

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("new room", (player) => {
    // check id of last room in array and add 1
    const lastRoomId = game.rooms[game.rooms.length - 1]?.id || 0;
    const newRoomId = lastRoomId ? parseInt(lastRoomId) + 1 : 1;
    socket.join(`${newRoomId}`);

    game.rooms.push({
      id: `${newRoomId}`,
      players: [
        {
          id: socket.id,
          username: player.username,
          score: 0,
        },
      ],
    });

    io.to(`${newRoomId}`).emit("game session", {
      ...player,
      room: `${newRoomId}`,
      gameMaster: true,
      msg: `Game Master ${player.username} joined`,
    });

    console.log(
      `user ${player.username} created room ${newRoomId}, ${socket.id}`
    );
  });

  socket.on("join room", (player) => {
    const roomExists = game.rooms.findIndex((r) => r.id === player.room);

    if (roomExists === -1) {
      console.log(
        `user ${player.username} tried to join room ${player.room}, ${socket.id}`
      );
      // return;
      socket.emit("error", "Room does not exist");
    } else {
      socket.join(`${player.room}`);

      game.rooms[roomExists].players.push({
        id: socket.id,
        username: player.username,
        score: 0,
      });

      io.to(`${player.room}`).emit("game session", {
        ...player,
        gameMaster: false,
        msg: `Player ${player.username} joined`,
      });

      console.log(`user ${username} joined room ${room}, ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected, ${socket.id}`);
  });
});

server.listen(CONFIG.PORT, () => {
  console.log("listening on *:3000");
});
