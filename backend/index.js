const express = require("express");
const path = require('path');
const { CONFIG } = require("./src/config");

const app = express();
const server = require("http").createServer(app);

const rootDir = path.resolve('../');
app.use(express.static(path.join(rootDir, 'frontend', 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(rootDir, 'frontend', 'build', 'index.html'));
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let sessions = [];

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join-session", (sessionId) => {
    const session = sessions.find((session) => session.id === sessionId);
    if (!session) {
      io.to(socket.id).emit(
        "error",
        "Oops! an error occured. Refresh the page and try again"
      );
      console.log(`Session with ID ${sessionId} does not exist`);
      return;
    }
    socket.join(sessionId);
    const player = {
      id: socket.id,
      name: "Player" + (session.players.length + 1),
      score: 0,
    };
    // players.push(player);
    session.players.push(player);
    // update sessions
    sessions = sessions.map((s) => {
      if (s.id === sessionId) {
        return session;
      }
      return s;
    });

    io.to(socket.id).emit("joined-session", session, player);
    // send message to session
    io.to(sessionId).emit("new-message", `Welcome to the game, ${player.name}!`);
    io.emit("update-sessions", sessions);
  });

  socket.on("start-session", () => {
    const session = {
      id: Date.now(),
      players: [],
      question: null,
      answer: null,
      winner: null,
      gameMaster: {
        id: socket.id,
        name: "Shinobi",
        score: 0,
      },
    };
    sessions.push(session);
    socket.join(session.id);
    io.emit("update-sessions", sessions);
    io.to(session.id).emit("joined-session", session, session.gameMaster);
    // send message to sender
    io.to(socket.id).emit("new-message", `Welcome to the game,${session.gameMaster.name}! You are the game master.`);

    console.log(`session at start-session: ${JSON.stringify(session)}`);
  });

  socket.on("create-question", (sessionId, { question, answer }) => {
    let session = sessions.find((session) => session.id === sessionId);
    if (!session) {
      io.to(socket.id).emit(
        "error",
        "Oops! an error occured. Refresh the page and try again"
      );
      console.log(`Session with ID ${sessionId} does not exist`);
      return;
    }
    console.log(`question: ${question}, answer: ${answer}`);

    // update session
    session = {
      ...session,
      question: question,
      answer: answer,
    };
    io.to(sessionId).emit("update-session", session);
    // send message to session except sender
    io.to(sessionId).emit(
      "new-message",
      `You have 60 seconds and 3 chances to guess the correct answer. Your time starts now!\n Question: ${question}`
    );

    console.log(`session: ${JSON.stringify(session)}`);

    // update session in global sessions
    sessions = sessions.map((s) => {
      // if session is found, update it
      if (s.id === sessionId) {
        return session;
      }
      return s;
    });
  });

  socket.on("guess", (sessionId, guess) => {
    const session = sessions.find((session) => session.id === sessionId);
    if (!session) {
      io.to(socket.id).emit(
        "error",
        "Oops! an error occured. Refresh the page and try again"
      );
      console.log(`Session with ID ${sessionId} does not exist`);
      return;
    }

    // find player's name
    const player = session.players.find((player) => player.id === socket.id);
    // send message to session except sender
    socket.broadcast
      .to(sessionId)
      .emit("new-message", `${player.name}: ${guess}`);
    // send message to sender
    io.to(socket.id).emit("new-message", `You: ${guess}`);

    if (guess === session.answer) {
      let winner = {};

      // update players
      const players = session.players.map((player) => {
        if (player.id === socket.id) {
          winner = player;
          return {
            ...player,
            score: player.score + 1,
          };
        }
        return player;
      });

      // update sessions
      sessions = sessions.map((s) => {
        if (s.id === sessionId) {
          const session = {
            ...s,
            winner: winner,
            players: players,
          };
          io.to(socket.id).emit(
            "new-message",
            `You guessed the right answer! 🎉🎉🎉`
          );
          socket.broadcast
            .to(sessionId)
            .emit(
              "new-message",
              `${winner.name} guessed the right answer! 🎉🎉🎉`
            );
          io.to(sessionId).emit("update-session", session);
          return session;
        }
        return s;
      });
    } else {
      socket.broadcast
        .to(sessionId)
        .emit("new-message", `${player.name} guessed wrong 👎🏽`);
      io.to(socket.id).emit("new-message", `You guessed wrong 👎🏽`);
      console.log(
        `guess: ${guess}, answer: ${session.answer}, ${typeof session.answer}`,
        guess === session.answer
      );
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    sessions.forEach((session) => {
      if (session.players.includes(socket.id)) {
        session.players = session.players.filter((id) => id !== socket.id);
        if (session.players.length === 0) {
          sessions = sessions.filter((s) => s.id !== session.id);
        }
        // find player's name
        const player = session.players.find(
          (player) => player.id === socket.id
        );
        io.to(session.id).emit("new-message", `${player.name} left`);
        io.to(session.id).emit("update-session", session);
      }
    });
    socket.broadcast.emit("update-sessions", sessions);
  });
});

server.listen(CONFIG.PORT, () => {
  console.log(`Server listening on port ${CONFIG.PORT}`);
});
