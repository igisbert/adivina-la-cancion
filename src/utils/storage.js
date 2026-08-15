const PROGRESS_KEY = 'musicgame_progress';
const STATS_KEY = 'musicgame_stats';
const DAILY_REFERENCE_DATE = new Date('2024-01-01').getTime();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getProgress() {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function setProgress(songId, { guesses, solved, attempts }) {
  if (typeof window === 'undefined') return;
  const progress = getProgress();
  progress[songId] = { guesses, solved, attempts, timestamp: Date.now() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getSongProgress(songId) {
  const progress = getProgress();
  return progress[songId] || null;
}

export function getStats() {
  if (typeof window === 'undefined') return { played: 0, wins: 0, streak: 0, maxStreak: 0, distribution: {} };
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : { played: 0, wins: 0, streak: 0, maxStreak: 0, distribution: {} };
  } catch {
    return { played: 0, wins: 0, streak: 0, maxStreak: 0, distribution: {} };
  }
}

export function updateStats(solved, attempts) {
  if (typeof window === 'undefined') return;
  const stats = getStats();
  
  stats.played += 1;
  
  if (solved) {
    stats.wins += 1;
    stats.streak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.distribution[attempts] = (stats.distribution[attempts] || 0) + 1;
  } else {
    stats.streak = 0;
  }
  
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getDailySongIndex(totalSongs) {
  const now = Date.now();
  const daysSinceReference = Math.floor((now - DAILY_REFERENCE_DATE) / MS_PER_DAY);
  return daysSinceReference % totalSongs;
}
