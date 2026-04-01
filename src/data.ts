import type {
  ParsedData, ProcessedStats, BookStats, DailyReading,
  HourlyReading, MonthlyReading, StreakInfo, TopSession,
} from './types';

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function computeBookStats(data: ParsedData): BookStats[] {
  const map = new Map<string, BookStats>();

  for (const s of data.readingSessions) {
    const key = s.personalDocumentId || s.asin || s.productName;
    const existing = map.get(key);
    const sessionDate = s.startTime || s.endTime;

    if (existing) {
      existing.totalReadingMs += s.totalReadingMs;
      existing.sessionCount += 1;
      if (sessionDate < existing.firstRead) existing.firstRead = new Date(sessionDate);
      if (sessionDate > existing.lastRead) existing.lastRead = new Date(sessionDate);
    } else {
      map.set(key, {
        name: s.productName,
        id: key,
        totalReadingMs: s.totalReadingMs,
        sessionCount: 1,
        firstRead: new Date(sessionDate),
        lastRead: new Date(sessionDate),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalReadingMs - a.totalReadingMs);
}

function computeDailyReadings(data: ParsedData): DailyReading[] {
  const map = new Map<string, number>();

  for (const s of data.readingSessions) {
    const d = s.startTime || s.endTime;
    const key = dateKey(d);
    map.set(key, (map.get(key) || 0) + s.totalReadingMs);
  }

  // Also include days from dayUnits that might not have sessions
  for (const day of data.readingDays) {
    if (!map.has(day)) {
      map.set(day, 0);
    }
  }

  return Array.from(map.entries())
    .map(([date, totalMs]) => ({ date, totalMs }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function computeHourlyReadings(data: ParsedData): HourlyReading[] {
  const hours: HourlyReading[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    totalMs: 0,
    sessionCount: 0,
  }));

  for (const s of data.readingSessions) {
    const d = s.startTime || s.endTime;
    const h = d.getHours();
    hours[h].totalMs += s.totalReadingMs;
    hours[h].sessionCount += 1;
  }

  return hours;
}

function computeMonthlyReadings(data: ParsedData): MonthlyReading[] {
  const map = new Map<string, { totalMs: number; books: Set<string> }>();

  for (const s of data.readingSessions) {
    const d = s.startTime || s.endTime;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!map.has(key)) {
      map.set(key, { totalMs: 0, books: new Set() });
    }
    const entry = map.get(key)!;
    entry.totalMs += s.totalReadingMs;
    entry.books.add(s.personalDocumentId || s.asin || s.productName);
  }

  return Array.from(map.entries())
    .map(([month, { totalMs, books }]) => ({ month, totalMs, uniqueBooks: books.size }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function computeStreaks(data: ParsedData): StreakInfo {
  const daysSet = new Set<string>();
  for (const s of data.readingSessions) {
    const d = s.startTime || s.endTime;
    daysSet.add(dateKey(d));
  }
  for (const day of data.readingDays) {
    daysSet.add(day);
  }

  const sortedDays = Array.from(daysSet).sort();
  if (sortedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalDaysRead: 0 };
  }

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Current streak: count backwards from most recent day
  const today = dateKey(new Date());
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  let currentStreak = 0;

  const lastDay = sortedDays[sortedDays.length - 1];
  if (lastDay === today || lastDay === yesterday) {
    currentStreak = 1;
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const curr = new Date(sortedDays[i + 1]);
      const prev = new Date(sortedDays[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalDaysRead: sortedDays.length,
  };
}

function computeTopSessions(data: ParsedData): TopSession[] {
  return data.readingSessions
    .map(s => ({
      productName: s.productName,
      date: s.startTime || s.endTime,
      durationMs: s.totalReadingMs,
    }))
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);
}

function computeDeviceBreakdown(data: ParsedData): { device: string; totalMs: number }[] {
  const map = new Map<string, number>();

  for (const s of data.deviceSessions) {
    const device = s.deviceFamily || 'Unknown';
    map.set(device, (map.get(device) || 0) + s.totalReadingMs);
  }

  return Array.from(map.entries())
    .map(([device, totalMs]) => ({ device, totalMs }))
    .sort((a, b) => b.totalMs - a.totalMs);
}

export function processData(data: ParsedData): ProcessedStats {
  const bookStats = computeBookStats(data);
  const dailyReadings = computeDailyReadings(data);
  const hourlyReadings = computeHourlyReadings(data);
  const monthlyReadings = computeMonthlyReadings(data);
  const streakInfo = computeStreaks(data);
  const topSessions = computeTopSessions(data);
  const deviceBreakdown = computeDeviceBreakdown(data);

  const totalReadingMs = bookStats.reduce((acc, b) => acc + b.totalReadingMs, 0);
  const totalBooks = bookStats.length;
  const totalDaysActive = dailyReadings.filter(d => d.totalMs > 0).length;
  const avgPerDayMs = totalDaysActive > 0 ? totalReadingMs / totalDaysActive : 0;

  const totalSessions = data.readingSessions.length;
  const avgPerSessionMs = totalSessions > 0 ? totalReadingMs / totalSessions : 0;

  return {
    bookStats,
    dailyReadings,
    hourlyReadings,
    monthlyReadings,
    streakInfo,
    topSessions,
    deviceBreakdown,
    goals: data.goals,
    completedTitles: data.completedTitles,
    totalReadingMs,
    totalBooks,
    totalDaysActive,
    avgPerDayMs,
    avgPerSessionMs,
  };
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Full breakdown for tooltips (exact time from milliseconds). */
export function formatDurationExact(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/** Minutes with fractional part for hover (exact from ms). */
export function formatMinutesExact(ms: number): string {
  if (ms <= 0) return '0 min';
  const min = ms / 60000;
  if (min >= 10) return `${min.toFixed(1)} min`;
  return `${min.toFixed(2)} min`;
}

export function formatHours(ms: number): string {
  return `${Math.round(ms / 3600000)}h`;
}

export function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10;
}

export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}
