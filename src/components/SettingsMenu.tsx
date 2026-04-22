import { useCallback, useEffect, useRef, useState } from 'react';
import type { KindleMode, ModernMode, Skin } from '../types';

interface SettingsMenuProps {
  skin: Skin;
  kindleMode: KindleMode;
  modernMode: ModernMode;
  setSkin: (skin: Skin) => void;
  setKindleMode: (mode: KindleMode) => void;
  setModernMode: (mode: ModernMode) => void;
}

const KINDLE_MODES: { id: KindleMode; label: string }[] = [
  { id: 'paper', label: 'Paper' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'night', label: 'Night' },
];

const MODERN_MODES: { id: ModernMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function SettingsMenu({
  skin,
  kindleMode,
  modernMode,
  setSkin,
  setKindleMode,
  setModernMode,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const toggleOpen = useCallback(() => setOpen(prev => !prev), []);

  const modes = skin === 'kindle' ? KINDLE_MODES : MODERN_MODES;
  const activeMode = skin === 'kindle' ? kindleMode : modernMode;
  const handleModeSelect = (id: string) => {
    if (skin === 'kindle') {
      setKindleMode(id as KindleMode);
    } else {
      setModernMode(id as ModernMode);
    }
  };

  return (
    <div className="settings-popover-wrapper" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        className="settings-button"
        aria-label="Appearance settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <GearIcon />
      </button>

      {open && (
        <div className="settings-popover" role="dialog" aria-label="Appearance settings">
          <div className="settings-section">
            <div className="settings-section-title">Skin</div>
            <div className="settings-skin-grid">
              <button
                type="button"
                className={`settings-skin-option${skin === 'kindle' ? ' active' : ''}`}
                onClick={() => setSkin('kindle')}
                aria-pressed={skin === 'kindle'}
              >
                <div className="settings-skin-swatch settings-skin-swatch-kindle" aria-hidden="true" />
                <div className="settings-skin-name">Kindle</div>
                <div className="settings-skin-detail">Paper, e-ink feel</div>
              </button>
              <button
                type="button"
                className={`settings-skin-option${skin === 'modern' ? ' active' : ''}`}
                onClick={() => setSkin('modern')}
                aria-pressed={skin === 'modern'}
              >
                <div className="settings-skin-swatch settings-skin-swatch-modern" aria-hidden="true" />
                <div className="settings-skin-name">Modern</div>
                <div className="settings-skin-detail">iOS-like</div>
              </button>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Mode</div>
            <div className="settings-mode-row" role="radiogroup" aria-label={`${skin} mode`}>
              {modes.map(m => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={activeMode === m.id}
                  className={`settings-mode-option${activeMode === m.id ? ' active' : ''}`}
                  onClick={() => handleModeSelect(m.id)}
                >
                  <span className={`settings-mode-swatch settings-mode-swatch-${m.id}`} aria-hidden="true" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
