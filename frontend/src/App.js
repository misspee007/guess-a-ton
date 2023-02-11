import { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
const ENDPOINT = `http://localhost:3001`;

const socket = socketIOClient(ENDPOINT);


function App() {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [player, setPlayer] = useState({
    username: "",
    room: "",
    gameMaster: false,
  });

  useEffect(() => {
    socket.on("game session", function ({ username, room, gameMaster, msg }) {
      console.log("server says:", username, room, gameMaster);

      setPlayer({ ...player, username, room, gameMaster });
      setMessages((messages) => [...messages, msg]);
    });

    socket.on("error", function (msg) {
      console.log("server says:", msg);

      setError(msg);
    });
  }, []);

  function handleNewRoom(e) {
    e.preventDefault();
    console.log("clicked new room");

    socket.emit("new room", player);
  }

  function handleJoinRoom(e) {
    e.preventDefault();
    console.log("clicked join room");

    let room = prompt("Enter room number");
    console.log(`room: ${room}`);
    setPlayer({ ...player, room: room, gameMaster: false });

    socket.emit("join room", player);
  }

  function handleStartGame(e) {
    e.preventDefault();
    console.log("clicked start game session");

    socket.emit("new game", player);
  }

  return (
    <div>
      {messages && (
        <ul id="messages">
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      )}
      <form onSubmit={(e) => e.preventDefault()}>
        {!player.room && (
          <label>
            <input
              type="text"
              name="username"
              id="username"
              value={player.username}
              onChange={(e) =>
                setPlayer({ ...player, username: e.target.value })
              }
              placeholder="Username"
              autoComplete="off"
            />
          </label>
        )}
        {player.room && !player.gameMaster && (
          <label>
            <input
              type="text"
              name="msgInput"
              id="msgInput"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Message"
              autoComplete="off"
            />
          </label>
        )}

        {error && <p>{error}</p>}

        {!player.room && (
          <>
            <button id="new" onClick={handleNewRoom}>
              New Room
            </button>

            <button id="join" type="button" onClick={handleJoinRoom}>
              Join Room
            </button>
          </>
        )}

        {player.room && player.gameMaster && (
          <button id="start" type="button" onClick={handleStartGame}>
            Start Game
          </button>
        )}
      </form>
    </div>
  );
}

export default App;
