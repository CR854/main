// =============================================================
// Qual é Meu Nome? — Core Game Logic
// =============================================================

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

class Game {
  constructor(correctWord, allowedWords) {
    this.correctWord = correctWord.toUpperCase();
    this.allowedSet = new Set(allowedWords.map((w) => w.toUpperCase()));
    this.allowedSet.add(this.correctWord);
    this.guesses = [];
    this.evaluations = [];
    this.status = "playing"; // "playing" | "won" | "lost"
  }

  submitGuess(guess) {
    guess = guess.toUpperCase();

    if (this.status !== "playing") {
      return { error: "game_over" };
    }
    if (guess.length !== WORD_LENGTH) {
      return { error: "wrong_length" };
    }
    if (!this.allowedSet.has(guess)) {
      return { error: "not_in_list" };
    }

    const evaluation = Game.evaluateGuess(guess, this.correctWord);
    this.guesses.push(guess);
    this.evaluations.push(evaluation);

    if (guess === this.correctWord) {
      this.status = "won";
    } else if (this.guesses.length >= MAX_GUESSES) {
      this.status = "lost";
    }

    return { evaluation, status: this.status };
  }

  static evaluateGuess(guess, target) {
    const result = Array(WORD_LENGTH).fill("absent");
    const targetCounts = {};

    // First pass: mark correct (green)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === target[i]) {
        result[i] = "correct";
      } else {
        targetCounts[target[i]] = (targetCounts[target[i]] || 0) + 1;
      }
    }

    // Second pass: mark present (yellow)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i] === "correct") continue;
      if (targetCounts[guess[i]] && targetCounts[guess[i]] > 0) {
        result[i] = "present";
        targetCounts[guess[i]]--;
      }
    }

    return result;
  }

  restore(state) {
    this.guesses = state.guesses;
    this.evaluations = state.evaluations;
    this.status = state.status;
  }

  serialize() {
    return {
      correctWord: this.correctWord,
      guesses: this.guesses,
      evaluations: this.evaluations,
      status: this.status,
    };
  }
}
