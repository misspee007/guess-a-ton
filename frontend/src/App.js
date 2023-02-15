import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { CONFIG } from "../src/config";

const socket = io(CONFIG.ENDPOINT);

const App = () => {
  const [err, setErr] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [player, setPlayer] = useState({});
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState({});
  const [inputValues, setInputValues] = useState({
    question: "",
    answer: "",
    guess: "",
  });

  const messagesRef = useRef(null);

  useEffect(() => {
    socket.on("joined-session", (currSession, currPlayer) => {
      setSession(currSession);
      setPlayer(currPlayer);
    });
    socket.on("update-session", (updatedSession) => {
      setSession(updatedSession);
      console.log("updatedSession: ", session);
    });
    socket.on("update-sessions", (currSessions) => {
      setSessions(currSessions);
    });
    socket.on("new-message", (message) => {
      // append li to ul
      const li = document.createElement("li");
      li.innerText = message;
      messagesRef.current.appendChild(li);
    });
    socket.on("error", (error) => {
      setErr(error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinSession = (sessionId) => {
    socket.emit("join-session", sessionId);
  };

  const startSession = () => {
    console.log("client says session before startSession: ", session);
    socket.emit("start-session");
  };

  const createQuestion = () => {
    socket.emit("create-question", session.id, {
      question: inputValues.question,
      answer: inputValues.answer,
    });
    // clear input
    setInputValues({ ...inputValues, question: "", answer: "" });
  };

  const submitGuess = () => {
    // send guess to server
    socket.emit("guess", session.id, inputValues.guess);
    // clear input
    setInputValues({ ...inputValues, guess: "" });
  };

  function handleInputChange(e) {
    const { name, value } = e.target;
    setInputValues({ ...inputValues, [name]: value });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
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
          <button type="button" onClick={startSession}>
            Start Session
          </button>
        </div>
      )}
      {session.id && (
        <div>
          <h3>Current Session: {session.id}</h3>
          <h4>Question: {session.question}</h4>
          {!session.winner?.id && session.gameMaster.id !== socket.id && (
            <>
              <label htmlFor="guess">
                <input
                  type="text"
                  name="guess"
                  placeholder="Answer"
                  onChange={handleInputChange}
                  value={inputValues.guess}
                />
              </label>
              <button type="button" onClick={submitGuess}>
                Guess
              </button>
            </>
          )}
          {session.winner?.id && (
            <>
              <p>The winner is: {session.winner.name}</p>
              <p>The answer is: {session.answer}</p>
            </>
          )}
          <h3>Players:</h3>
          {session.players.map((player) => (
            <p key={player.id}>
              {player.name} - Score: {player.score}
            </p>
          ))}
          <h3>Game Master:</h3>
          <p>{session.gameMaster.name}</p>
          {session.question === null && session.gameMaster.id === socket.id && (
            <div>
              <label htmlFor="question">
                <input
                  type="text"
                  name="question"
                  placeholder="Question"
                  onChange={handleInputChange}
                  value={inputValues.question}
                />
              </label>
              <label htmlFor="answer">
                <input
                  type="text"
                  name="answer"
                  placeholder="Answer"
                  onChange={handleInputChange}
                  value={inputValues.answer}
                />
              </label>
              <button onClick={createQuestion}>Set Question</button>
            </div>
          )}
          <ul ref={messagesRef}></ul>
        </div>
        // display messages
      )}
      {err && <div>{err}</div>}
    </form>
  );
};

export default App;
