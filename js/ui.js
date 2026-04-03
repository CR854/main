// =============================================================
// Qual é Meu Nome? — UI Rendering
// =============================================================

const WIN_MESSAGES = [
  "Gênio!",
  "Magnífico!",
  "Impressionante!",
  "Esplêndido!",
  "Ótimo!",
  "Ufa!",
];

let messageTimeout = null;

function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let r = 0; r < MAX_GUESSES; r++) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.row = r;
      tile.dataset.col = c;
      board.appendChild(tile);
    }
  }
}

function getTile(row, col) {
  return document.querySelector(
    `.tile[data-row="${row}"][data-col="${col}"]`
  );
}

function setTileLetter(row, col, letter) {
  const tile = getTile(row, col);
  tile.textContent = letter;
  if (letter) {
    tile.classList.add("filled");
  } else {
    tile.classList.remove("filled");
  }
}

function revealRow(row, evaluation, onComplete) {
  const tiles = [];
  for (let c = 0; c < WORD_LENGTH; c++) {
    tiles.push(getTile(row, c));
  }

  let revealed = 0;

  tiles.forEach((tile, i) => {
    setTimeout(() => {
      tile.classList.add("flip");

      setTimeout(() => {
        tile.classList.remove("flip");
        tile.classList.add(evaluation[i]);
        tile.classList.add("flip-out");

        setTimeout(() => {
          tile.classList.remove("flip-out");
          revealed++;
          if (revealed === WORD_LENGTH && onComplete) {
            onComplete();
          }
        }, 250);
      }, 250);
    }, i * 300);
  });
}

function revealRowInstant(row, evaluation, guess) {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTile(row, c);
    tile.textContent = guess[c];
    tile.classList.add("filled", evaluation[c]);
  }
}

function bounceRow(row) {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTile(row, c);
    setTimeout(() => {
      tile.classList.add("bounce");
      tile.addEventListener(
        "animationend",
        () => tile.classList.remove("bounce"),
        { once: true }
      );
    }, c * 100);
  }
}

function shakeRow(row) {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTile(row, c);
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => tile.classList.remove("shake"),
      { once: true }
    );
  }
}

function updateKeyboard(letterStates) {
  const priority = { correct: 3, present: 2, absent: 1 };
  const buttons = document.querySelectorAll("#keyboard button[data-key]");

  buttons.forEach((btn) => {
    const key = btn.dataset.key;
    if (key.length !== 1) return;
    const state = letterStates[key];
    if (state) {
      btn.classList.remove("correct", "present", "absent");
      btn.classList.add(state);
    }
  });
}

function showMessage(text, duration = 1500) {
  const container = document.getElementById("message-container");
  const msg = document.createElement("div");
  msg.classList.add("message");
  msg.textContent = text;
  container.appendChild(msg);

  if (messageTimeout) clearTimeout(messageTimeout);

  messageTimeout = setTimeout(() => {
    msg.classList.add("fade-out");
    msg.addEventListener("animationend", () => msg.remove(), { once: true });
  }, duration);
}

function showGameOver(status, guessCount, correctWord, stats, timeStr) {
  var overlay = document.getElementById("modal-overlay");
  var title = document.getElementById("modal-title");
  var message = document.getElementById("modal-message");

  if (status === "won") {
    title.textContent = WIN_MESSAGES[guessCount - 1] || "Parabéns!";
    message.textContent = "Você acertou em " + guessCount + " tentativa" + (guessCount > 1 ? "s" : "") + "!";
  } else {
    title.textContent = "Que pena!";
    message.textContent = "O nome era: " + correctWord;
  }

  if (timeStr) {
    message.textContent += "\nTempo: " + timeStr;
  }

  renderStats(stats);
  overlay.classList.remove("hidden");
}

function hideModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

function renderStats(stats) {
  document.getElementById("stat-played").textContent = stats.played;
  document.getElementById("stat-win-pct").textContent =
    stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  document.getElementById("stat-streak").textContent = stats.currentStreak;
  document.getElementById("stat-max-streak").textContent = stats.maxStreak;

  const distContainer = document.getElementById("guess-distribution");
  distContainer.innerHTML = "";
  const maxDist = Math.max(...stats.distribution, 1);

  for (let i = 0; i < MAX_GUESSES; i++) {
    const row = document.createElement("div");
    row.classList.add("dist-row");

    const label = document.createElement("span");
    label.classList.add("dist-label");
    label.textContent = i + 1;

    const bar = document.createElement("span");
    bar.classList.add("dist-bar");
    const count = stats.distribution[i] || 0;
    const pct = Math.max((count / maxDist) * 100, 8);
    bar.style.width = `${pct}%`;
    bar.textContent = count;

    if (
      stats.lastGuessCount === i + 1 &&
      stats.lastResult === "won"
    ) {
      bar.classList.add("highlight");
    }

    row.appendChild(label);
    row.appendChild(bar);
    distContainer.appendChild(row);
  }
}
