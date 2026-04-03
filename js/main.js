// =============================================================
// Qual é Meu Nome? — Main Entry Point
// =============================================================
// Depends on: words.js, game.js, ui.js, storage.js (loaded first)

let game;
let currentInput = [];
let currentRow = 0;
let letterStates = {};
let isRevealing = false;

let playerName = "";
let timerStart = null;
let timerInterval = null;
let elapsedSeconds = 0;

// ---- Name screen ----

function setupNameScreen() {
  const nameInput = document.getElementById("player-name-input");
  const startBtn = document.getElementById("start-game-btn");

  function startWithName() {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    playerName = name;
    document.getElementById("name-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    init();
  }

  startBtn.addEventListener("click", startWithName);
  nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      startWithName();
    }
  });

  nameInput.focus();
}

// ---- Timer ----

function startTimer() {
  if (timerStart) return;
  timerStart = Date.now();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (timerStart) {
    elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
  }
}

function updateTimerDisplay() {
  if (!timerStart) return;
  elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
  var mins = Math.floor(elapsedSeconds / 60);
  var secs = elapsedSeconds % 60;
  document.getElementById("timer-display").textContent =
    String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function formatTime(totalSeconds) {
  var mins = Math.floor(totalSeconds / 60);
  var secs = totalSeconds % 60;
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

// ---- Email ----

function sendResultEmail(status, guessCount) {
  var resultText = status === "won"
    ? "ACERTOU em " + guessCount + " tentativa" + (guessCount > 1 ? "s" : "")
    : "NAO ACERTOU";

  var guessLines = game.guesses.map(function (g, i) {
    var colors = game.evaluations[i].map(function (e) {
      if (e === "correct") return "🟩";
      if (e === "present") return "🟨";
      return "⬜";
    }).join("");
    return (i + 1) + ". " + g + " " + colors;
  }).join("\n");

  var message = "Jogador: " + playerName + "\n"
    + "Resultado: " + resultText + "\n"
    + "Tempo: " + formatTime(elapsedSeconds) + "\n"
    + "Resposta: " + game.correctWord + "\n\n"
    + "Palpites:\n" + guessLines;

  fetch("https://formspree.io/f/mykbndyg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _subject: "Qual é Meu Nome? - Resultado de " + playerName,
      message: message,
    }),
  }).catch(function () {
    // silently ignore send failures
  });
}

// ---- Share ----

function buildShareText(status, guessCount, evaluations, timeStr) {
  var result = status === "won" ? guessCount + "/6" : "X/6";
  var lines = evaluations.map(function (eval_) {
    return eval_.map(function (e) {
      if (e === "correct") return "🟩";
      if (e === "present") return "🟨";
      return "⬜";
    }).join("");
  }).join("\n");

  return "Qual é Meu Nome? " + result + "\n"
    + "Tempo: " + timeStr + "\n\n"
    + lines;
}

function copyToClipboard(text) {
  // Try modern API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showMessage("Copiado!");
    }).catch(function () {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "0";
  ta.setAttribute("readonly", "");
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    showMessage("Copiado!");
  } catch (_) {
    showMessage("Erro ao copiar");
  }
  document.body.removeChild(ta);
}

function setupShareButtons() {
  document.getElementById("share-copy").addEventListener("click", function () {
    var text = buildShareText(
      game.status,
      game.guesses.length,
      game.evaluations,
      formatTime(elapsedSeconds)
    );
    copyToClipboard(text);
  });
}

// ---- Game ----

function init() {
  game = new Game(CORRECT_WORD, ALLOWED_WORDS);
  createBoard();
  clearSavedGame(CORRECT_WORD);

  document.addEventListener("keydown", handleKeyDown);
  document.getElementById("keyboard").addEventListener("click", handleKeyClick);
  document.getElementById("modal-close").addEventListener("click", hideModal);
  setupShareButtons();
}

function rebuildLetterStates() {
  var priority = { correct: 3, present: 2, absent: 1 };
  letterStates = {};

  for (var r = 0; r < game.guesses.length; r++) {
    var guess = game.guesses[r];
    var eval_ = game.evaluations[r];
    for (var c = 0; c < WORD_LENGTH; c++) {
      var letter = guess[c];
      var state = eval_[c];
      var cur = letterStates[letter];
      if (!cur || priority[state] > priority[cur]) {
        letterStates[letter] = state;
      }
    }
  }
}

function handleKeyDown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === "Enter") {
    e.preventDefault();
    submitGuess();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    deleteLetter();
  } else {
    var key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      addLetter(key);
    }
  }
}

function handleKeyClick(e) {
  var btn = e.target.closest("button[data-key]");
  if (!btn) return;

  var key = btn.dataset.key;
  if (key === "ENTER") {
    submitGuess();
  } else if (key === "BACKSPACE") {
    deleteLetter();
  } else {
    addLetter(key);
  }
}

function addLetter(letter) {
  if (game.status !== "playing" || isRevealing) return;
  if (currentInput.length >= WORD_LENGTH) return;

  // Start timer on first letter of the entire game
  if (!timerStart) {
    startTimer();
  }

  currentInput.push(letter);
  setTileLetter(currentRow, currentInput.length - 1, letter);
}

function deleteLetter() {
  if (game.status !== "playing" || isRevealing) return;
  if (currentInput.length === 0) return;

  currentInput.pop();
  setTileLetter(currentRow, currentInput.length, "");
}

function submitGuess() {
  if (game.status !== "playing" || isRevealing) return;

  var guess = currentInput.join("");

  if (guess.length < WORD_LENGTH) {
    shakeRow(currentRow);
    showMessage("Faltam letras");
    return;
  }

  var result = game.submitGuess(guess);

  if (result.error === "not_in_list") {
    shakeRow(currentRow);
    showMessage("Nome não encontrado");
    return;
  }

  if (result.error === "already_guessed") {
    shakeRow(currentRow);
    showMessage("Nome já utilizado");
    return;
  }

  if (result.error) return;

  isRevealing = true;
  var revealingRow = currentRow;

  revealRow(revealingRow, result.evaluation, function () {
    var priority = { correct: 3, present: 2, absent: 1 };
    for (var c = 0; c < WORD_LENGTH; c++) {
      var letter = guess[c];
      var state = result.evaluation[c];
      var cur = letterStates[letter];
      if (!cur || priority[state] > priority[cur]) {
        letterStates[letter] = state;
      }
    }
    updateKeyboard(letterStates);

    if (result.status === "won") {
      stopTimer();
      bounceRow(revealingRow);
      setTimeout(function () {
        var stats = recordResult("won", game.guesses.length);
        showGameOver("won", game.guesses.length, game.correctWord, stats, formatTime(elapsedSeconds));
        sendResultEmail("won", game.guesses.length);
      }, 800);
    } else if (result.status === "lost") {
      stopTimer();
      setTimeout(function () {
        var stats = recordResult("lost", game.guesses.length);
        showGameOver("lost", game.guesses.length, game.correctWord, stats, formatTime(elapsedSeconds));
        sendResultEmail("lost", game.guesses.length);
      }, 400);
    }

    isRevealing = false;
  });

  currentInput = [];
  currentRow++;
}

// Start with name screen
document.addEventListener("DOMContentLoaded", setupNameScreen);
