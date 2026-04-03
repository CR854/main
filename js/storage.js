// =============================================================
// Qual é Meu Nome? — LocalStorage Persistence
// =============================================================

const GAME_KEY_PREFIX = "qemn_game_";
const STATS_KEY = "qemn_stats";

function gameKey(correctWord) {
  return GAME_KEY_PREFIX + correctWord;
}

export function saveGame(state) {
  try {
    localStorage.setItem(gameKey(state.correctWord), JSON.stringify(state));
  } catch (_) {
    // localStorage unavailable or full — silently ignore
  }
}

export function loadGame(correctWord) {
  try {
    const raw = localStorage.getItem(gameKey(correctWord));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function defaultStats() {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    lastGuessCount: 0,
    lastResult: null,
  };
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...defaultStats(), ...JSON.parse(raw) } : defaultStats();
  } catch (_) {
    return defaultStats();
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (_) {
    // silently ignore
  }
}

export function recordResult(status, guessCount) {
  const stats = loadStats();
  stats.played++;
  stats.lastResult = status;
  stats.lastGuessCount = guessCount;

  if (status === "won") {
    stats.won++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.distribution[guessCount - 1]++;
  } else {
    stats.currentStreak = 0;
  }

  saveStats(stats);
  return stats;
}
