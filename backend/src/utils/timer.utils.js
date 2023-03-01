let timerId = null;
let timeLeft = 30;

function startTimer(sessionId, answer, io) {
  timerId = setInterval(() => {
    if (timeLeft <= 0) {
      // stop countdown timer
      clearInterval(timerId);
      io.to(sessionId).emit(
        "new-message",
        `Time's up! ⏲\n\n The correct answer is "${answer}"`
      );
      io.to(sessionId).emit("game-over", sessionId);
      return;
    }

    timeLeft -= 1;
    io.to(sessionId).emit("update-timer", timeLeft);
  }, 1000);
}

// stop countdown timer
function stopTimer(timerId) {
  clearInterval(timerId);
}

module.exports = { startTimer, stopTimer, timerId };
