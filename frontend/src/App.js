import "./App.css";
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
  const [timer, setTimer] = useState(60);
  const [chances, setChances] = useState(3);

  const messagesRef = useRef(null);

  useEffect(() => {
    socket.on("update-timer", (timeLeft) => {
      setTimer(timeLeft);
    });
    socket.on("game-over", (sessionId) => {
      console.log("game over");
      socket.emit("end-round", sessionId);
    });
    socket.on("new-round", () => {
      setTimer(60);
      setChances(3);
    });
    socket.on("joined-session", (currSession, currPlayer) => {
      setSession(currSession);
      setPlayer(currPlayer);
    });
    socket.on("update-session", (updatedSession) => {
      setSession(updatedSession);
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
    socket.emit("guess", session.id, inputValues.guess, chances);
    // clear input
    setInputValues({ ...inputValues, guess: "" });
    if (chances < 1) {
      return;
    }
    // decrement chances
    const chancesLeft = chances - 1;
    setChances(chancesLeft);
  };

  function handleInputChange(e) {
    const { name, value } = e.target;
    setInputValues({ ...inputValues, [name]: value });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {!session.id && (
        <div className="home">
          <h1 className="heading-1">Are you ready to guess a ton?!</h1>
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <button onClick={() => joinSession(session.id)}>
                  Join Game - {session.id}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-start" onClick={startSession}>
            Start Game
          </button>
        </div>
      )}
      {session.id && (
        <div className="session">
          <div className="header-wrap">
            <div className="header">
              <h1 className="heading-1">Room {session.id}</h1>
              <h2 className="heading-2">
                Game Master:
                <p>{session.gameMaster.name}</p>
              </h2>
              {session.question && (
                <>
                  <h2 className="heading-2">
                    Question: <p>{session.question}</p>
                  </h2>
                  {session.winner?.id && (
                    <h2 className="heading-2">
                      Answer: <p>{session.answer}</p>
                    </h2>
                  )}
                </>
              )}
              <div>
                <div className="timer">
                  <h2 className="heading-2">
                    Time Left: <p>{timer}s</p>
                  </h2>

                  <div className="timer-bar">
                    <div
                      className="timer-bar-fill"
                      style={{ width: `${(timer / 60) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {session.gameMaster.id !== socket.id && (
                  <h2 className="heading-2">
                    Chances Left: <p>{chances}</p>
                  </h2>
                )}
              </div>
            </div>
          </div>

          <div className="main">
            <ul ref={messagesRef} className="messages"></ul>

            {session.gameMaster.id === socket.id && (
              <div className="input-gm input">
                <div className="left">
                  <label>
                    <input
                      type="text"
                      name="question"
                      placeholder="Question"
                      onChange={handleInputChange}
                      value={inputValues.question}
                    />
                  </label>
                  <label>
                    <input
                      type="text"
                      name="answer"
                      placeholder="Answer"
                      onChange={handleInputChange}
                      value={inputValues.answer}
                    />
                  </label>
                </div>
                <button type="button" onClick={createQuestion}>
                  Submit
                </button>
              </div>
            )}

            {session.gameMaster.id !== socket.id && (
              <div className="input-p input">
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
              </div>
            )}
          </div>
        </div>
        // display messages
      )}
    </form>
  );
};

export default App;

// Todo:
// - fix timer not resetting after new round starts
// - fix disable buttons
// - fix changes left not decrementing after new round starts
