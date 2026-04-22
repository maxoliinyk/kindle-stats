import type {
  ParsedData, ProcessedStats, BookStats, DailyReading,
  HourlyReading, MonthlyReading, StreakInfo, TopSession, BookDetailStats, BookSessionDetail, DeviceDetailStats,
} from './types';

export const MIN_SESSION_MS = 3 * 60 * 1000;

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

function computeDeviceDetails(data: ParsedData): DeviceDetailStats[] {
  const map = new Map<string, DeviceDetailStats>();

  for (const session of data.deviceSessions) {
    const device = session.deviceFamily || 'Unknown';
    if (!map.has(device)) {
      map.set(device, {
        device,
        totalMs: 0,
        sessionCount: 0,
        avgSessionMs: 0,
        sessions: [],
      });
    }

    const detail = map.get(device)!;
    detail.totalMs += session.totalReadingMs;
    detail.sessionCount += 1;
    detail.sessions.push({
      id: `${device}-${session.endTimestamp.toISOString()}-${detail.sessionCount}`,
      asin: session.asin || '',
      endTimestamp: session.endTimestamp,
      durationMs: session.totalReadingMs,
      contentType: session.contentType || 'Unknown',
      pageFlips: session.numberOfPageFlips,
    });
  }

  const details = Array.from(map.values());
  for (const detail of details) {
    detail.avgSessionMs = detail.sessionCount > 0 ? detail.totalMs / detail.sessionCount : 0;
    detail.sessions.sort((a, b) => b.endTimestamp.getTime() - a.endTimestamp.getTime());
  }

  return details.sort((a, b) => b.totalMs - a.totalMs);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const clampedP = Math.max(0, Math.min(1, p));
  const index = (sorted.length - 1) * clampedP;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function consistencyScore(values: number[]): number {
  if (values.length <= 1) return values.length === 0 ? 0 : 100;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean <= 0) return 0;
  const cv = stdDev(values) / mean;
  return Math.max(0, Math.min(100, Math.round(100 / (1 + cv))));
}

function bucketSessionDurations(values: number[]) {
  const minutes = values.map(value => value / 60000);
  return minutes.reduce(
    (acc, value) => {
      if (value < 5) acc.under5m += 1;
      else if (value < 15) acc.from5To15m += 1;
      else if (value < 30) acc.from15To30m += 1;
      else if (value < 60) acc.from30To60m += 1;
      else acc.over60m += 1;
      return acc;
    },
    {
      under5m: 0,
      from5To15m: 0,
      from15To30m: 0,
      from30To60m: 0,
      over60m: 0,
    },
  );
}

function computeBookDetails(data: ParsedData): Record<string, BookDetailStats> {
  const deviceByAsin = new Map<string, typeof data.deviceSessions>();
  const allDurationsByBook = new Map<string, number[]>();
  const uniqueDaysByBook = new Map<string, Set<string>>();
  for (const session of data.deviceSessions) {
    if (!session.asin) continue;
    const current = deviceByAsin.get(session.asin) ?? [];
    current.push(session);
    deviceByAsin.set(session.asin, current);
  }

  const details = new Map<string, BookDetailStats>();

  for (const session of data.readingSessions) {
    const key = session.personalDocumentId || session.asin || session.productName;
    const sessionDate = session.startTime || session.endTime;
    const deviceSessions = session.asin ? (deviceByAsin.get(session.asin) ?? []) : [];
    const matchedDevice = deviceSessions[0];
    const pageFlips = matchedDevice?.numberOfPageFlips ?? 0;
    const deviceFamily = matchedDevice?.deviceFamily || 'Unknown';
    const contentType = matchedDevice?.contentType || 'Unknown';

    if (!details.has(key)) {
      details.set(key, {
        id: key,
        name: session.productName || 'Unknown',
        asin: session.asin || '',
        personalDocumentId: session.personalDocumentId || '',
        totalReadingMs: 0,
        sessionCount: 0,
        validSessionCount: 0,
        avgSessionMs: 0,
        avgValidSessionMs: 0,
        medianSessionMs: 0,
        medianValidSessionMs: 0,
        p25ValidSessionMs: 0,
        p75ValidSessionMs: 0,
        shortestSessionMs: 0,
        longestSessionMs: 0,
        consistencyScore: 0,
        sessionDurationBuckets: {
          under5m: 0,
          from5To15m: 0,
          from15To30m: 0,
          from30To60m: 0,
          over60m: 0,
        },
        uniqueDays: 0,
        firstRead: new Date(sessionDate),
        lastRead: new Date(sessionDate),
        totalPageFlips: 0,
        avgPageFlipsPerSession: 0,
        deviceFamilies: [],
        contentTypes: [],
        sessions: [],
      });
    }

    const detail = details.get(key)!;
    const durations = allDurationsByBook.get(key) ?? [];
    durations.push(session.totalReadingMs);
    allDurationsByBook.set(key, durations);
    const uniqueDays = uniqueDaysByBook.get(key) ?? new Set<string>();
    uniqueDays.add(dateKey(sessionDate));
    uniqueDaysByBook.set(key, uniqueDays);

    detail.totalReadingMs += session.totalReadingMs;
    detail.sessionCount += 1;
    detail.totalPageFlips += pageFlips;
    if (sessionDate < detail.firstRead) detail.firstRead = new Date(sessionDate);
    if (sessionDate > detail.lastRead) detail.lastRead = new Date(sessionDate);
    if (deviceFamily && !detail.deviceFamilies.includes(deviceFamily)) detail.deviceFamilies.push(deviceFamily);
    if (contentType && !detail.contentTypes.includes(contentType)) detail.contentTypes.push(contentType);

    detail.validSessionCount += 1;
    const sessionId = `${key}-${session.endTime.toISOString()}-${detail.validSessionCount}`;
    const sessionDetail: BookSessionDetail = {
      id: sessionId,
      asin: session.asin || '',
      personalDocumentId: session.personalDocumentId || '',
      startTime: session.startTime,
      endTime: session.endTime,
      durationMs: session.totalReadingMs,
      readingMarketplace: session.readingMarketplace || '',
      deviceFamily,
      contentType,
      pageFlips,
    };
    detail.sessions.push(sessionDetail);
  }

  for (const detail of details.values()) {
    detail.sessions.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
    const allDurations = allDurationsByBook.get(detail.id) ?? [];
    const validDurations = detail.sessions.map(s => s.durationMs);
    detail.avgSessionMs = detail.sessionCount > 0 ? detail.totalReadingMs / detail.sessionCount : 0;
    detail.avgValidSessionMs = detail.validSessionCount > 0
      ? validDurations.reduce((acc, value) => acc + value, 0) / detail.validSessionCount
      : 0;
    detail.medianSessionMs = median(allDurations);
    detail.medianValidSessionMs = median(validDurations);
    detail.p25ValidSessionMs = percentile(validDurations, 0.25);
    detail.p75ValidSessionMs = percentile(validDurations, 0.75);
    detail.shortestSessionMs = validDurations.length > 0 ? Math.min(...validDurations) : 0;
    detail.longestSessionMs = validDurations.length > 0 ? Math.max(...validDurations) : 0;
    detail.consistencyScore = consistencyScore(validDurations);
    detail.sessionDurationBuckets = bucketSessionDurations(validDurations);
    detail.uniqueDays = (uniqueDaysByBook.get(detail.id) ?? new Set()).size;
    detail.avgPageFlipsPerSession = detail.validSessionCount > 0 ? detail.totalPageFlips / detail.validSessionCount : 0;
  }

  return Object.fromEntries(details.entries());
}

export function processData(data: ParsedData): ProcessedStats {
  const filteredData: ParsedData = {
    ...data,
    readingSessions: data.readingSessions.filter(session => session.totalReadingMs >= MIN_SESSION_MS),
    deviceSessions: data.deviceSessions.filter(session => session.totalReadingMs >= MIN_SESSION_MS),
  };

  const bookStats = computeBookStats(filteredData);
  const bookDetails = computeBookDetails(filteredData);
  const dailyReadings = computeDailyReadings(filteredData);
  const hourlyReadings = computeHourlyReadings(filteredData);
  const monthlyReadings = computeMonthlyReadings(filteredData);
  const streakInfo = computeStreaks(filteredData);
  const topSessions = computeTopSessions(filteredData);
  const deviceBreakdown = computeDeviceBreakdown(filteredData);
  const deviceDetails = computeDeviceDetails(filteredData);

  const totalReadingMs = bookStats.reduce((acc, b) => acc + b.totalReadingMs, 0);
  const totalBooks = bookStats.length;
  const totalDaysActive = dailyReadings.filter(d => d.totalMs > 0).length;
  const avgPerDayMs = totalDaysActive > 0 ? totalReadingMs / totalDaysActive : 0;

  const totalSessions = filteredData.readingSessions.length;
  const avgPerSessionMs = totalSessions > 0 ? totalReadingMs / totalSessions : 0;

  return {
    bookStats,
    bookDetails,
    dailyReadings,
    hourlyReadings,
    monthlyReadings,
    streakInfo,
    topSessions,
    deviceBreakdown,
    deviceDetails,
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

/** Exact reading time in hours and minutes (without seconds). */
export function formatDurationExactHM(ms: number): string {
  if (ms <= 0) return '0m';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Minutes with fractional part for hover (exact from ms). */
export function formatMinutesExact(ms: number): string {
  if (ms <= 0) return '0 min';
  const min = ms / 60000;
  if (min >= 10) return `${min.toFixed(1)} min`;
  return `${min.toFixed(2)} min`;
}

export function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10;
}

export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}
