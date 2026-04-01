import type { ReadingSession, DeviceSession, CompletedTitle, ReadingGoal, HighlightAction, ParsedData } from './types';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return lines.filter(l => l.trim().length > 0).map(parseCSVLine);
}

function safeDate(s: string): Date | null {
  if (!s || s === 'Not Available' || s === 'Not Applicable') return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function safeNumber(s: string): number {
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

export function parseReadingInsightsSessions(text: string): ReadingSession[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  // Header: ASIN,end_time,personal_document_id,product_name,reading_marketplace,start_time,total_reading_milliseconds
  return rows.slice(1).map(cols => ({
    asin: cols[0] || '',
    endTime: safeDate(cols[1]) || new Date(),
    personalDocumentId: cols[2] || '',
    productName: cols[3] || 'Unknown',
    readingMarketplace: cols[4] || '',
    startTime: safeDate(cols[5]),
    totalReadingMs: safeNumber(cols[6]),
  })).filter(s => s.totalReadingMs > 0 && s.productName !== 'Not Available');
}

export function parseDeviceSessions(text: string): DeviceSession[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  // Header: start_timestamp,end_timestamp,ASIN,purchased_marketplace,preferred_marketplace,device_family,device_serial_number,device_software_version,content_type,total_reading_millis,number_of_page_flips
  return rows.slice(1).map(cols => ({
    startTimestamp: safeDate(cols[0]),
    endTimestamp: safeDate(cols[1]) || new Date(),
    asin: cols[2] || '',
    deviceFamily: cols[5] || 'Unknown',
    contentType: cols[8] || '',
    totalReadingMs: safeNumber(cols[9]),
    numberOfPageFlips: safeNumber(cols[10]),
  })).filter(s => s.totalReadingMs > 0);
}

export function parseDayUnits(text: string): string[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  return rows.slice(1).map(cols => {
    const d = safeDate(cols[0]);
    return d ? d.toISOString().split('T')[0] : '';
  }).filter(Boolean);
}

export function parseCompletedTitles(text: string): CompletedTitle[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  // Header: asin_date_and_content_type,personal_document_id,product_name
  return rows.slice(1).map(cols => {
    const parts = (cols[0] || '').split('_');
    return {
      date: parts[1] || '',
      type: parts[2] || '',
      personalDocumentId: cols[1] || '',
      productName: cols[2] || 'Unknown',
    };
  });
}

export function parseGoals(text: string): ReadingGoal[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  // Header: create_date,goal_id,goal_value,has_been_congratulated,last_modified_date
  return rows.slice(1).map(cols => {
    const goalId = cols[1] || '';
    const yearMatch = goalId.match(/(\d{4})/);
    return {
      goalId,
      goalValue: safeNumber(cols[2]),
      year: yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear(),
      hasBeenCongratulated: cols[3] === 'true',
    };
  });
}

export function parseHighlights(text: string): HighlightAction[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  // Header: created_timestamp,ASIN,customer_context,action,highlight_color,is_starred,show_options_after_highlighting,number_of_words_in_highlight,device_family,country,preferred_marketplace
  return rows.slice(1).map(cols => ({
    timestamp: safeDate(cols[0]) || new Date(),
    asin: cols[1] || '',
    action: cols[3] || '',
    highlightColor: cols[4] || '',
    numberOfWords: safeNumber(cols[7]),
    deviceFamily: cols[8] || '',
  }));
}

interface FileEntry {
  name: string;
  path: string;
  file: File;
}

async function readDirectoryRecursive(entry: FileSystemDirectoryEntry): Promise<FileEntry[]> {
  const files: FileEntry[] = [];

  async function traverse(dirEntry: FileSystemDirectoryEntry, path: string) {
    const reader = dirEntry.createReader();
    let entries: FileSystemEntry[] = [];

    // readEntries may not return all entries in one call
    let batch: FileSystemEntry[];
    do {
      batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      entries = entries.concat(batch);
    } while (batch.length > 0);

    for (const entry of entries) {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        files.push({ name: entry.name, path: path + '/' + entry.name, file });
      } else if (entry.isDirectory) {
        await traverse(entry as FileSystemDirectoryEntry, path + '/' + entry.name);
      }
    }
  }

  await traverse(entry, entry.name);
  return files;
}

const FILE_TARGETS = {
  readingInsights: 'Kindle.reading-insights-sessions_with_adjustments.csv',
  deviceSessions: 'Kindle.Devices.ReadingSession.csv',
  dayUnits: 'Kindle.ReadingInsightsDayUnits.csv',
  completedTitles: 'Kindle.UserUniqueTitlesCompleted.csv',
  goals: 'Kindle.reading-insights-goal-information.csv',
  highlights: 'Kindle.Devices.kindleHighlightActions_v1.csv',
};

export async function parseDroppedFolder(items: DataTransferItemList): Promise<ParsedData> {
  let allFiles: FileEntry[] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry();
    if (entry?.isDirectory) {
      const files = await readDirectoryRecursive(entry as FileSystemDirectoryEntry);
      allFiles = allFiles.concat(files);
    }
  }

  const findFile = (targetName: string): FileEntry | undefined =>
    allFiles.find(f => f.name === targetName);

  const readText = async (fe: FileEntry | undefined): Promise<string> => {
    if (!fe) return '';
    return fe.file.text();
  };

  const [insightsText, deviceText, dayText, completedText, goalsText, highlightsText] =
    await Promise.all([
      readText(findFile(FILE_TARGETS.readingInsights)),
      readText(findFile(FILE_TARGETS.deviceSessions)),
      readText(findFile(FILE_TARGETS.dayUnits)),
      readText(findFile(FILE_TARGETS.completedTitles)),
      readText(findFile(FILE_TARGETS.goals)),
      readText(findFile(FILE_TARGETS.highlights)),
    ]);

  return {
    readingSessions: parseReadingInsightsSessions(insightsText),
    deviceSessions: parseDeviceSessions(deviceText),
    readingDays: parseDayUnits(dayText),
    completedTitles: parseCompletedTitles(completedText),
    goals: parseGoals(goalsText),
    highlights: parseHighlights(highlightsText),
  };
}
