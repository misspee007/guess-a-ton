const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { CONFIG } = require("./src/config");

let players = [];
let sessions = [];

io.on("connection", (socket) => {
  try {
    console.log(`Player connected: ${socket.id}`);

    socket.on("join-session", (sessionId) => {
      const session = sessions.find((session) => session.id === sessionId);
      if (!session) {
        socket.emit("invalid-session", sessionId);
        return;
      }
      socket.join(sessionId);
      const player = {
        id: socket.id,
        name: "Player" + (players.length + 1),
        score: 0,
      };
      players.push(player);
      io.to(sessionId).emit("update-players", players);
      socket.emit("joined-session", session, player);
    });

    socket.on("start-session", (session) => {
      sessions.push(session);
      socket.broadcast.emit("update-sessions", sessions);
    });

    socket.on("create-question", (sessionId, question) => {
      let session = sessions.find((session) => session.id === sessionId);
      if (!session) {
        socket.emit("invalid-session");
        return;
      }
      session = { ...session, question };
      io.to(sessionId).emit("update-question", question);
    });

    socket.on("guess", (sessionId, guess) => {
      const session = sessions.find((session) => session.id === sessionId);
      if (!session) {
        socket.emit("invalid-session");
        return;
      }
      if (guess === session.answer) {
        const player = players.find((player) => player.id === socket.id);
        player.score += 10;
        session.winner = player;
        io.to(sessionId).emit("update-players", players);
        io.to(sessionId).emit("update-winner", player);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      players = players.filter((player) => player.id !== socket.id);
      sessions.forEach((session) => {
        if (session.players.includes(socket.id)) {
          session.players = session.players.filter((id) => id !== socket.id);
          if (session.players.length === 0) {
            sessions = sessions.filter((s) => s.id !== session.id);
          }
        }
      });
      socket.broadcast.emit("update-players", players);
      socket.broadcast.emit("update-sessions", sessions);
    });
  } catch (error) {
    console.log(error);
  }
});

server.listen(CONFIG.PORT, () => {
  console.log(`Server listening on port ${CONFIG.PORT}`);
});
