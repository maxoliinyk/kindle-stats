import type { ProcessedStats } from './types';

export const THEME_STORAGE_KEY = 'kindle-stats-theme';
export const STATS_STORAGE_KEY = 'kindle-stats-stats-v1';

interface PersistedStatsPayload {
  version: 2;
  savedAt: string;
  stats: ProcessedStats;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function reviveProcessedStatsDates(stats: ProcessedStats): ProcessedStats {
  const revivedBookDetails = Object.fromEntries(
    Object.entries(stats.bookDetails || {}).map(([bookId, detail]) => [
      bookId,
      {
        ...detail,
        firstRead: new Date(detail.firstRead),
        lastRead: new Date(detail.lastRead),
        sessions: detail.sessions.map(session => ({
          ...session,
          startTime: session.startTime ? new Date(session.startTime) : null,
          endTime: new Date(session.endTime),
        })),
      },
    ]),
  );

  return {
    ...stats,
    bookDetails: revivedBookDetails,
    deviceDetails: (stats.deviceDetails || []).map(device => ({
      ...device,
      sessions: device.sessions.map(session => ({
        ...session,
        endTimestamp: new Date(session.endTimestamp),
      })),
    })),
    bookStats: stats.bookStats.map(book => ({
      ...book,
      firstRead: new Date(book.firstRead),
      lastRead: new Date(book.lastRead),
    })),
    topSessions: stats.topSessions.map(session => ({
      ...session,
      date: new Date(session.date),
    })),
  };
}

function isValidPersistedPayload(value: unknown): value is PersistedStatsPayload {
  if (!isObjectLike(value)) return false;
  if (value.version !== 2) return false;
  if (typeof value.savedAt !== 'string') return false;
  if (!isObjectLike(value.stats)) return false;
  return true;
}

export function saveStats(stats: ProcessedStats): void {
  const payload: PersistedStatsPayload = {
    version: 2,
    savedAt: new Date().toISOString(),
    stats,
  };
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(payload));
}

export function loadStats(): ProcessedStats | null {
  const raw = localStorage.getItem(STATS_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidPersistedPayload(parsed)) {
      localStorage.removeItem(STATS_STORAGE_KEY);
      return null;
    }
    return reviveProcessedStatsDates(parsed.stats);
  } catch {
    localStorage.removeItem(STATS_STORAGE_KEY);
    return null;
  }
}

export function clearStats(): void {
  localStorage.removeItem(STATS_STORAGE_KEY);
}
