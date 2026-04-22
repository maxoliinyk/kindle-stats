export interface ReadingSession {
  productName: string;
  personalDocumentId: string;
  asin: string;
  startTime: Date | null;
  endTime: Date;
  totalReadingMs: number;
  readingMarketplace: string;
}

export interface DeviceSession {
  startTimestamp: Date | null;
  endTimestamp: Date;
  asin: string;
  deviceFamily: string;
  contentType: string;
  totalReadingMs: number;
  numberOfPageFlips: number;
}

export interface CompletedTitle {
  personalDocumentId: string;
  productName: string;
  date: string;
  type: string;
}

export interface ReadingGoal {
  goalId: string;
  goalValue: number;
  year: number;
  hasBeenCongratulated: boolean;
}

export interface HighlightAction {
  timestamp: Date;
  asin: string;
  action: string;
  highlightColor: string;
  numberOfWords: number;
  deviceFamily: string;
}

export interface BookStats {
  name: string;
  id: string;
  totalReadingMs: number;
  sessionCount: number;
  firstRead: Date;
  lastRead: Date;
}

export interface DailyReading {
  date: string;
  totalMs: number;
}

export interface HourlyReading {
  hour: number;
  totalMs: number;
  sessionCount: number;
}

export interface MonthlyReading {
  month: string;
  totalMs: number;
  uniqueBooks: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDaysRead: number;
}

export interface TopSession {
  productName: string;
  date: Date;
  durationMs: number;
}

export interface DeviceSessionSummary {
  id: string;
  asin: string;
  endTimestamp: Date;
  durationMs: number;
  contentType: string;
  pageFlips: number;
}

export interface DeviceDetailStats {
  device: string;
  totalMs: number;
  sessionCount: number;
  avgSessionMs: number;
  sessions: DeviceSessionSummary[];
}

export interface BookSessionDetail {
  id: string;
  asin: string;
  personalDocumentId: string;
  startTime: Date | null;
  endTime: Date;
  durationMs: number;
  readingMarketplace: string;
  deviceFamily: string;
  contentType: string;
  pageFlips: number;
}

export interface SessionDurationBuckets {
  under5m: number;
  from5To15m: number;
  from15To30m: number;
  from30To60m: number;
  over60m: number;
}

export interface BookDetailStats {
  id: string;
  name: string;
  asin: string;
  personalDocumentId: string;
  totalReadingMs: number;
  sessionCount: number;
  validSessionCount: number;
  avgSessionMs: number;
  avgValidSessionMs: number;
  medianSessionMs: number;
  medianValidSessionMs: number;
  p25ValidSessionMs: number;
  p75ValidSessionMs: number;
  shortestSessionMs: number;
  longestSessionMs: number;
  consistencyScore: number;
  sessionDurationBuckets: SessionDurationBuckets;
  uniqueDays: number;
  firstRead: Date;
  lastRead: Date;
  totalPageFlips: number;
  avgPageFlipsPerSession: number;
  deviceFamilies: string[];
  contentTypes: string[];
  sessions: BookSessionDetail[];
}

export interface ParsedData {
  readingSessions: ReadingSession[];
  deviceSessions: DeviceSession[];
  readingDays: string[];
  completedTitles: CompletedTitle[];
  goals: ReadingGoal[];
  highlights: HighlightAction[];
}

export interface ProcessedStats {
  bookStats: BookStats[];
  bookDetails: Record<string, BookDetailStats>;
  dailyReadings: DailyReading[];
  hourlyReadings: HourlyReading[];
  monthlyReadings: MonthlyReading[];
  streakInfo: StreakInfo;
  topSessions: TopSession[];
  deviceBreakdown: { device: string; totalMs: number }[];
  deviceDetails: DeviceDetailStats[];
  goals: ReadingGoal[];
  completedTitles: CompletedTitle[];
  totalReadingMs: number;
  totalBooks: number;
  totalDaysActive: number;
  avgPerDayMs: number;
  avgPerSessionMs: number;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

export type Skin = 'kindle' | 'modern';
export type KindleMode = 'paper' | 'sepia' | 'night';
export type ModernMode = 'light' | 'dark';
export type AppearanceMode = KindleMode | ModernMode;

export interface AppearanceState {
  skin: Skin;
  kindleMode: KindleMode;
  modernMode: ModernMode;
}
