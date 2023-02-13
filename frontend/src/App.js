import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

const App = () => {
  const [player, setPlayer] = useState({});
  const [session, setSession] = useState({});
  const [sessions, setSessions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState({});
  const [guess, setGuess] = useState("");
  const [winner, setWinner] = useState({});
  const [err, setErr] = useState("");

  useEffect(() => {
    socket.on("joined-session", (currSession, currPlayer) => {
      setSession(currSession);
      setPlayer(currPlayer);
    });
    socket.on("update-sessions", (currSessions) => {
      setSessions(currSessions);
    });
    socket.on("update-players", (currPlayers) => {
      setPlayers(currPlayers);
    });
    socket.on("update-question", (question) => {
      setQuestion(question);
    });
    socket.on("update-winner", (currWinner) => {
      setWinner(currWinner);
    });
    socket.on("invalid-session", (sessionId) => {
      setErr(
        `Oops! Session with ID ${sessionId} does not exist, try starting a new session or joining another one.`
      );
    });
  }, []);

  const joinSession = (sessionId) => {
    socket.emit("join-session", sessionId);
  };

  const startSession = () => {
    socket.emit("start-session", { id: socket.id });
  };

  const createQuestion = ({ question, answer }) => {
    console.log(
      `${socket.id} set question ${question} with answer ${answer}. The Game Master is ${session.gameMaster}`
    );
    socket.emit("create-question", session.id, question);
  };

  const submitGuess = (guess) => {
    console.log(`Player ${player} guessed: ${guess}, in session ${session.id}`);
    socket.emit("guess", session.id, guess);
  };

  return (
    <div>
      {!session.id && (
        <div>
          <h3>Available Sessions:</h3>
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <button onClick={() => joinSession(session.id)}>
                  Join Session - {session.id}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={startSession}>Start Session</button>
        </div>
      )}
      {session.id && (
        <div>
          <h3>Current Session: {session.id}</h3>
          <h4>Question: {question.question}</h4>
          {!winner.id && (
            <>
              <input
                type="text"
                placeholder="Answer"
                onChange={(e) => setGuess(e.target.value)}
              />
              <button type="button" onClick={() => submitGuess(guess)}>
                Guess
              </button>
            </>
          )}
          {winner.id && <p>The winner is: {winner.id}</p>}
          <h3>Players:</h3>
          {players.map((player) => (
            <p key={player.id}>
              {player.name || "Game Master"} - Score: {player.score}
            </p>
          ))}
          {session.question === null && session.gameMaster === socket.id && (
            <div>
              <input
                type="text"
                placeholder="Question"
                onChange={(e) =>
                  setQuestion({ ...question, question: e.target.value})
                }
              />
              <input
                type="text"
                placeholder="Answer"
                onChange={(e) =>
                  setQuestion({...question, answer: e.target.value })
                }
              />
              <button onClick={() => createQuestion(question)}>
                Set Question
              </button>
            </div>
          )}
        </div>
      )}
      {err && <div>{err}</div>}
    </div>
  );
};

export default App;
