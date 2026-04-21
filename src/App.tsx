import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from './hooks/useTheme';
import { parseDroppedFolder } from './parser';
import { processData } from './data';
import { loadStats, saveStats, clearStats } from './storage';
import { ThemeToggle } from './components/ThemeToggle';
import { DropZone } from './components/DropZone';
import { Dashboard } from './components/Dashboard';
import { BookDetailsPage } from './components/BookDetailsPage';
import type { ProcessedStats } from './types';

type AppState = 'idle' | 'loading' | 'ready' | 'error';

const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

function toAppPath(pathname: string): string {
  if (!BASE_PATH) return pathname || '/';
  if (pathname === BASE_PATH) return '/';
  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length) || '/';
  }
  return pathname || '/';
}

function toBrowserPath(appPath: string): string {
  const normalizedAppPath = appPath.startsWith('/') ? appPath : `/${appPath}`;
  if (!BASE_PATH) return normalizedAppPath;
  return `${BASE_PATH}${normalizedAppPath === '/' ? '/' : normalizedAppPath}`;
}

function safeDecodePathPart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractBookIdFromPath(path: string): string {
  if (!path.startsWith('/book/')) return '';
  const raw = path.slice('/book/'.length).replace(/\/+$/, '');
  return safeDecodePathPart(raw);
}

function normalizeBookKey(value: string): string {
  return safeDecodePathPart(value).trim();
}

export default function App() {
  const { mode, setMode } = useTheme();
  const [state, setState] = useState<AppState>('idle');
  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [error, setError] = useState<string>('');
  const [path, setPath] = useState<string>(toAppPath(window.location.pathname));

  const navigate = useCallback((nextPath: string) => {
    const browserPath = toBrowserPath(nextPath);
    if (window.location.pathname !== browserPath) {
      window.history.pushState({}, '', browserPath);
    }
    setPath(nextPath);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const appPath = toAppPath(window.location.pathname);
      setPath(appPath);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  useEffect(() => {
    const saved = loadStats();
    if (saved) {
      setStats(saved);
      setState('ready');
    }
  }, []);

  const handleDrop = useCallback(async (items: DataTransferItemList) => {
    setState('loading');
    setError('');
    try {
      const parsed = await parseDroppedFolder(items);

      if (parsed.readingSessions.length === 0 && parsed.deviceSessions.length === 0) {
        setError('No reading data found. Make sure you dropped the Kindle folder from your Amazon data export.');
        setState('error');
        return;
      }

      const processed = processData(parsed);
      setStats(processed);
      saveStats(processed);
      setState('ready');
    } catch (err) {
      console.error('Parse error:', err);
      setError(`Error parsing data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setState('error');
    }
  }, []);

  const handleReload = useCallback(() => {
    setState('idle');
    setStats(null);
    setError('');
    clearStats();
    navigate('/');
  }, [navigate]);

  const selectedBookId = useMemo(() => extractBookIdFromPath(path), [path]);
  const selectedBook = useMemo(() => {
    if (!stats || !selectedBookId) return null;
    const normalizedTarget = normalizeBookKey(selectedBookId);
    const direct = stats.bookDetails[selectedBookId] ?? stats.bookDetails[normalizedTarget];
    if (direct) return direct;

    const normalizedMap = new Map(
      Object.entries(stats.bookDetails).map(([bookId, detail]) => [normalizeBookKey(bookId), detail]),
    );
    return normalizedMap.get(normalizedTarget) ?? null;
  }, [stats, selectedBookId]);

  const handleBookSelect = useCallback((bookId: string) => {
    if (!stats) {
      navigate(`/book/${encodeURIComponent(bookId)}`);
      return;
    }

    const normalizedTarget = normalizeBookKey(bookId);
    const canonicalBookId = Object.keys(stats.bookDetails).find(
      candidate => normalizeBookKey(candidate) === normalizedTarget,
    ) ?? bookId;

    navigate(`/book/${encodeURIComponent(canonicalBookId)}`);
  }, [navigate, stats]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <h1 className="header-title">
            <span>📖</span> Kindle Stats
          </h1>
          <div className="header-actions">
            <ThemeToggle mode={mode} setMode={setMode} />
          </div>
        </div>
      </header>

      <main>
        {state === 'idle' && <DropZone onDrop={handleDrop} />}

        {state === 'loading' && (
          <div className="loading">
            <div className="spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>Parsing your reading data…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="drop-zone-overlay">
            <div className="drop-zone" onClick={handleReload} style={{ cursor: 'pointer' }}>
              <div className="drop-zone-icon">⚠️</div>
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <p className="hint" style={{ marginTop: 16 }}>Click here to try again.</p>
            </div>
          </div>
        )}

        {state === 'ready' && stats && (
          path.startsWith('/book/')
            ? (
              selectedBook
                ? <BookDetailsPage book={selectedBook} onBack={handleBackToDashboard} />
                : (
                  <div className="dashboard">
                    <div className="chart-card full-width">
                      <h3>Book Not Found</h3>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                        This book page could not be resolved from current data.
                      </p>
                      <button className="reload-btn" onClick={handleBackToDashboard}>← Back to Dashboard</button>
                    </div>
                  </div>
                )
            )
            : <Dashboard stats={stats} onReload={handleReload} onBookSelect={handleBookSelect} />
        )}
      </main>
    </>
  );
}
