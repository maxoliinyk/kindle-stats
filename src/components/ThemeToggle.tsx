import type { ThemeMode } from '../types';

interface ThemeToggleProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export function ThemeToggle({ mode, setMode }: ThemeToggleProps) {
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme selection">
      <button
        className={mode === 'auto' ? 'active' : ''}
        onClick={() => setMode('auto')}
        aria-label="Auto theme"
        title="Auto (System)"
      >
        Auto
      </button>
      <button
        className={mode === 'light' ? 'active' : ''}
        onClick={() => setMode('light')}
        aria-label="Light theme"
        title="Light"
      >
        Light
      </button>
      <button
        className={mode === 'dark' ? 'active' : ''}
        onClick={() => setMode('dark')}
        aria-label="Dark theme"
        title="Dark"
      >
        Dark
      </button>
    </div>
  );
}
