import { useState, useCallback, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { parseDroppedFolder } from './parser';
import { processData } from './data';
import { loadStats, saveStats, clearStats } from './storage';
import { ThemeToggle } from './components/ThemeToggle';
import { DropZone } from './components/DropZone';
import { Dashboard } from './components/Dashboard';
import type { ProcessedStats } from './types';

type AppState = 'idle' | 'loading' | 'ready' | 'error';

export default function App() {
  const { mode, setMode } = useTheme();
  const [state, setState] = useState<AppState>('idle');
  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [error, setError] = useState<string>('');

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
  }, []);

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
          <Dashboard stats={stats} onReload={handleReload} />
        )}
      </main>
    </>
  );
}
