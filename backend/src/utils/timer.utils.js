function startTimer(sessionId, answer, session, io) {
  // start countdown timer
  let timeLeft = 60;
  const timer = setInterval(() => {
    if (timeLeft <= 0) {
      stopTimer(sessionId, answer, session, timer, io);
      return;
    }

    timeLeft -= 1;
    io.to(sessionId).emit("update-timer", timeLeft);
  }, 1000);
}

// stop countdown timer
function stopTimer(sessionId, answer, session, timer, io) {
  clearInterval(timer);
  io.to(sessionId).emit(
    "new-message",
    `Time's up!\n The correct answer is "${answer}"`
  );

  // reset session
  session = {
    ...session,
    question: null,
    answer: null,
    winner: null,
  };
  io.to(sessionId).emit("update-session", session);
}

module.exports = startTimer;