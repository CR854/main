// =============================================================
// Qual vai ser o nome do bebê? — Main Entry Point
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
let lang = "pt";

// ---- Translations ----

var T = {
  pt: {
    gameTitle: "Qual vai ser o nome do bebê?",
    namePrompt: 'Antes de começar, precisamos saber: qual é o <strong>seu</strong> nome?',
    nameHint: "Este é o seu nome, não o palpite!",
    namePlaceholder: "Seu nome",
    nameContinue: "Continuar",
    instrTitle: "Como jogar",
    instrDesc: "Descubra o nome do bebê em 6 tentativas. O nome tem 5 letras.",
    instrRule1: "Cada palpite deve ser um nome de 5 letras.",
    instrRule2: "Após cada palpite, as cores das letras mudam para mostrar o quão perto você está.",
    instrExamplesTitle: "Exemplos",
    ex1: 'A letra <strong>C</strong> está no nome e na posição correta.',
    ex2: 'A letra <strong>U</strong> está no nome, mas em outra posição.',
    ex3: 'A letra <strong>A</strong> não está no nome.',
    instrNote: '<strong>Atenção:</strong> no jogo, apenas nomes masculinos são aceitos!',
    startPlaying: "Começar",
    missingLetters: "Faltam letras",
    notInList: "Nome não encontrado",
    alreadyGuessed: "Nome já utilizado",
    loseMessage: "O nome será: ",
    youGuessed: function (n) { return "Você acertou em " + n + " tentativa" + (n > 1 ? "s" : "") + "!"; },
    tooSad: "Que pena!",
    shareText: "Qual vai ser o nome do bebê? ",
    shareCopy: "Copiar Resultado",
    shareWhatsapp: "Compartilhar",
    shareHint: "Apenas o tempo e as cores são compartilhados. Os nomes não aparecem!",
    copied: "Copiado!",
    copyError: "Erro ao copiar",
    emailSubject: "Qual vai ser o nome do bebê? - Resultado de ",
    winMessages: ["Gênio!", "Magnífico!", "Impressionante!", "Esplêndido!", "Ótimo!", "Ufa!"],
  },
  en: {
    gameTitle: "What will be the baby's name?",
    namePrompt: 'Before we start, we need to know: what is <strong>your</strong> name?',
    nameHint: "This is your name, not your guess!",
    namePlaceholder: "Your name",
    nameContinue: "Continue",
    instrTitle: "How to play",
    instrDesc: "Guess the baby's name in 6 tries. The name has 5 letters.",
    instrRule1: "Each guess must be a 5-letter name.",
    instrRule2: "After each guess, the tile colors change to show how close you are.",
    instrExamplesTitle: "Examples",
    ex1: 'The letter <strong>C</strong> is in the name and in the correct position.',
    ex2: 'The letter <strong>U</strong> is in the name but in a different position.',
    ex3: 'The letter <strong>A</strong> is not in the name.',
    instrNote: '<strong>Note:</strong> only male names are accepted!',
    startPlaying: "Start",
    missingLetters: "Not enough letters",
    notInList: "Name not found",
    alreadyGuessed: "Already guessed",
    loseMessage: "The name will be: ",
    youGuessed: function (n) { return "You got it in " + n + " tr" + (n > 1 ? "ies" : "y") + "!"; },
    tooSad: "Too bad!",
    shareText: "What will be the baby's name? ",
    shareCopy: "Copy Result",
    shareWhatsapp: "Share",
    shareHint: "Only time and colors are shared. The names won't appear!",
    copied: "Copied!",
    copyError: "Copy failed",
    emailSubject: "What will be the baby's name? - Result from ",
    winMessages: ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"],
  },
};

function t(key) {
  return T[lang][key];
}

// ---- Language screen ----

function setupLangScreen() {
  var buttons = document.querySelectorAll("#lang-screen .lang-btn");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      lang = btn.dataset.lang;
      document.getElementById("lang-screen").classList.add("hidden");
      applyTranslations();
      document.getElementById("name-screen").classList.remove("hidden");
      document.getElementById("player-name-input").focus();
    });
  });
}

function applyTranslations() {
  // Name screen
  document.getElementById("name-prompt").innerHTML = t("namePrompt");
  document.getElementById("name-hint").textContent = t("nameHint");
  document.getElementById("player-name-input").placeholder = t("namePlaceholder");
  document.getElementById("start-game-btn").textContent = t("nameContinue");

  // Instructions screen
  document.getElementById("instr-title").textContent = t("instrTitle");
  document.getElementById("instr-desc").textContent = t("instrDesc");
  var rules = document.getElementById("instr-rules");
  rules.innerHTML = "<li>" + t("instrRule1") + "</li><li>" + t("instrRule2") + "</li>";
  document.getElementById("instr-examples-title").textContent = t("instrExamplesTitle");
  document.getElementById("ex1-text").innerHTML = t("ex1");
  document.getElementById("ex2-text").innerHTML = t("ex2");
  document.getElementById("ex3-text").innerHTML = t("ex3");
  document.getElementById("instr-note").innerHTML = t("instrNote");
  document.getElementById("start-playing-btn").textContent = t("startPlaying");

  // Share buttons
  document.getElementById("share-copy").textContent = t("shareCopy");
  document.getElementById("share-whatsapp").textContent = t("shareWhatsapp");
  document.getElementById("share-hint").textContent = t("shareHint");
}

// ---- Name screen ----

function setupNameScreen() {
  var nameInput = document.getElementById("player-name-input");
  var startBtn = document.getElementById("start-game-btn");

  function startWithName() {
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    playerName = name;
    document.getElementById("name-screen").classList.add("hidden");
    showInstructions();
  }

  startBtn.addEventListener("click", startWithName);
  nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      startWithName();
    }
  });
}

// ---- Instructions screen ----

function showInstructions() {
  document.getElementById("instructions-screen").classList.remove("hidden");
  document.getElementById("start-playing-btn").addEventListener("click", function () {
    document.getElementById("instructions-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    init();
  });
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
      _subject: t("emailSubject") + playerName,
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

  return t("shareText") + result + "\n"
    + (lang === "pt" ? "Tempo: " : "Time: ") + timeStr + "\n\n"
    + lines;
}

function copyToClipboard(text) {
  if (navigator.share) {
    navigator.share({ text: text }).catch(function () {});
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function () {
      showMessage(t("copied"));
    }).catch(function () {
      fallbackCopy(text);
    });
    return;
  }

  fallbackCopy(text);
}

function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "0";
  ta.style.top = "0";
  ta.style.width = "1px";
  ta.style.height = "1px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);

  ta.contentEditable = true;
  ta.readOnly = false;
  var range = document.createRange();
  range.selectNodeContents(ta);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  ta.setSelectionRange(0, 999999);

  try {
    document.execCommand("copy");
    showMessage(t("copied"));
  } catch (_) {
    showMessage(t("copyError"));
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

  document.getElementById("share-whatsapp").addEventListener("click", function () {
    var text = buildShareText(
      game.status,
      game.guesses.length,
      game.evaluations,
      formatTime(elapsedSeconds)
    );
    var url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
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
    showMessage(t("missingLetters"));
    return;
  }

  // Easter eggs
  if (guess === "CARLO" || guess === "ROCHA") {
    handleEasterEgg(guess);
    return;
  }

  var result = game.submitGuess(guess);

  if (result.error === "not_in_list") {
    shakeRow(currentRow);
    showMessage(t("notInList"));
    return;
  }

  if (result.error === "already_guessed") {
    shakeRow(currentRow);
    showMessage(t("alreadyGuessed"));
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

function showEasterEggEmoji(emoji) {
  var el = document.getElementById("emoji-overlay");
  el.textContent = emoji;
  el.classList.remove("hidden");
  el.style.animation = "none";
  el.offsetHeight;
  el.style.animation = "";
  setTimeout(function () {
    el.classList.add("hidden");
  }, 1500);
}

function handleEasterEgg(guess) {
  isRevealing = true;
  var row = currentRow;
  var allCorrect = ["correct", "correct", "correct", "correct", "correct"];

  revealRow(row, allCorrect, function () {
    showEasterEggEmoji("😜");

    if (guess === "CARLO") {
      var realEval = Game.evaluateGuess(guess, CORRECT_WORD);
      var delay = 800;
      for (var i = WORD_LENGTH - 1; i >= 0; i--) {
        (function (col, state) {
          setTimeout(function () {
            var tile = getTile(row, col);
            tile.classList.remove("correct", "present", "absent");
            tile.classList.add("flip");
            setTimeout(function () {
              tile.classList.remove("flip");
              tile.classList.add(state);
              tile.classList.add("flip-out");
              setTimeout(function () {
                tile.classList.remove("flip-out");
              }, 250);
            }, 250);
          }, delay);
          delay += 400;
        })(i, realEval[i]);
      }

      setTimeout(function () {
        var result = game.submitGuess(guess);
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
        isRevealing = false;

        if (result.status === "lost") {
          stopTimer();
          setTimeout(function () {
            var stats = recordResult("lost", game.guesses.length);
            showGameOver("lost", game.guesses.length, game.correctWord, stats, formatTime(elapsedSeconds));
            sendResultEmail("lost", game.guesses.length);
          }, 400);
        }
      }, delay + 200);

      currentInput = [];
      currentRow++;

    } else if (guess === "ROCHA") {
      var delay = 800;
      for (var i = WORD_LENGTH - 1; i >= 0; i--) {
        (function (col) {
          setTimeout(function () {
            var tile = getTile(row, col);
            tile.classList.add("flip");
            setTimeout(function () {
              tile.classList.remove("flip", "correct", "present", "absent", "filled");
              tile.textContent = "";
              tile.classList.add("flip-out");
              setTimeout(function () {
                tile.classList.remove("flip-out");
              }, 250);
            }, 250);
          }, delay);
          delay += 400;
        })(i);
      }

      setTimeout(function () {
        showMessage(t("notInList"), 2500);
        currentInput = [];
        isRevealing = false;
      }, delay + 200);
    }
  });
}

// Start
document.addEventListener("DOMContentLoaded", function () {
  setupLangScreen();
  setupNameScreen();
});
