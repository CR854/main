// =============================================================
// Qual é Meu Nome? — Main Entry Point
// =============================================================
// Depends on: words.js, game.js, ui.js, storage.js (loaded first)

let game;
let currentInput = [];
let currentRow = 0;
let letterStates = {};
let isRevealing = false;

function init() {
  game = new Game(CORRECT_WORD, ALLOWED_WORDS);
  createBoard();

  // Try to restore saved game
  const saved = loadGame(CORRECT_WORD);
  if (saved && saved.correctWord === CORRECT_WORD) {
    game.restore(saved);
    currentRow = game.guesses.length;

    // Rebuild board from saved state
    for (let r = 0; r < game.guesses.length; r++) {
      revealRowInstant(r, game.evaluations[r], game.guesses[r]);
    }

    // Rebuild keyboard state
    rebuildLetterStates();
    updateKeyboard(letterStates);

    // If game was already over, show modal after a short delay
    if (game.status !== "playing") {
      setTimeout(() => {
        const stats = loadStats();
        showGameOver(
          game.status,
          game.guesses.length,
          game.correctWord,
          stats
        );
      }, 500);
    }
  }

  // Wire keyboard events
  document.addEventListener("keydown", handleKeyDown);
  document.getElementById("keyboard").addEventListener("click", handleKeyClick);
  document.getElementById("modal-close").addEventListener("click", hideModal);
}

function rebuildLetterStates() {
  const priority = { correct: 3, present: 2, absent: 1 };
  letterStates = {};

  for (let r = 0; r < game.guesses.length; r++) {
    const guess = game.guesses[r];
    const eval_ = game.evaluations[r];
    for (let c = 0; c < WORD_LENGTH; c++) {
      const letter = guess[c];
      const state = eval_[c];
      const cur = letterStates[letter];
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
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      addLetter(key);
    }
  }
}

function handleKeyClick(e) {
  const btn = e.target.closest("button[data-key]");
  if (!btn) return;

  const key = btn.dataset.key;
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

  const guess = currentInput.join("");

  if (guess.length < WORD_LENGTH) {
    shakeRow(currentRow);
    showMessage("Faltam letras");
    return;
  }

  const result = game.submitGuess(guess);

  if (result.error === "not_in_list") {
    shakeRow(currentRow);
    showMessage("Nome não encontrado");
    return;
  }

  if (result.error) return;

  // Valid guess — reveal
  isRevealing = true;
  const revealingRow = currentRow;

  revealRow(revealingRow, result.evaluation, () => {
    // Update keyboard after reveal animation
    const priority = { correct: 3, present: 2, absent: 1 };
    for (let c = 0; c < WORD_LENGTH; c++) {
      const letter = guess[c];
      const state = result.evaluation[c];
      const cur = letterStates[letter];
      if (!cur || priority[state] > priority[cur]) {
        letterStates[letter] = state;
      }
    }
    updateKeyboard(letterStates);

    // Save state
    saveGame(game.serialize());

    if (result.status === "won") {
      bounceRow(revealingRow);
      setTimeout(() => {
        const stats = recordResult("won", game.guesses.length);
        showGameOver("won", game.guesses.length, game.correctWord, stats);
      }, 800);
    } else if (result.status === "lost") {
      setTimeout(() => {
        const stats = recordResult("lost", game.guesses.length);
        showGameOver("lost", game.guesses.length, game.correctWord, stats);
      }, 400);
    }

    isRevealing = false;
  });

  currentInput = [];
  currentRow++;
}

// Start the game when DOM is ready
document.addEventListener("DOMContentLoaded", init);
