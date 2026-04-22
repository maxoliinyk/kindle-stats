import type { AppearanceState, KindleMode, ModernMode, Skin, ThemeMode } from './types';
import { APPEARANCE_STORAGE_KEY, THEME_STORAGE_KEY } from './storage';

const VALID_THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];
const VALID_SKINS: Skin[] = ['kindle', 'modern'];
const VALID_KINDLE_MODES: KindleMode[] = ['paper', 'sepia', 'night'];
const VALID_MODERN_MODES: ModernMode[] = ['light', 'dark'];

function isThemeMode(value: string): value is ThemeMode {
  return VALID_THEME_MODES.includes(value as ThemeMode);
}

function isSkin(value: unknown): value is Skin {
  return typeof value === 'string' && VALID_SKINS.includes(value as Skin);
}

function isKindleMode(value: unknown): value is KindleMode {
  return typeof value === 'string' && VALID_KINDLE_MODES.includes(value as KindleMode);
}

function isModernMode(value: unknown): value is ModernMode {
  return typeof value === 'string' && VALID_MODERN_MODES.includes(value as ModernMode);
}

export function getStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (!stored) return 'auto';
  return isThemeMode(stored) ? stored : 'auto';
}

function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function defaultAppearance(): AppearanceState {
  return {
    skin: 'kindle',
    kindleMode: prefersDark() ? 'night' : 'paper',
    modernMode: prefersDark() ? 'dark' : 'light',
  };
}

function migrateLegacyAppearance(): AppearanceState | null {
  const legacy = localStorage.getItem(THEME_STORAGE_KEY);
  if (!legacy || !isThemeMode(legacy)) return null;

  const modernMode: ModernMode = legacy === 'dark'
    ? 'dark'
    : legacy === 'light'
      ? 'light'
      : prefersDark() ? 'dark' : 'light';

  return {
    skin: 'modern',
    kindleMode: prefersDark() ? 'night' : 'paper',
    modernMode,
  };
}

export function getStoredAppearance(): AppearanceState {
  const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<AppearanceState>;
      const fallback = defaultAppearance();
      return {
        skin: isSkin(parsed.skin) ? parsed.skin : fallback.skin,
        kindleMode: isKindleMode(parsed.kindleMode) ? parsed.kindleMode : fallback.kindleMode,
        modernMode: isModernMode(parsed.modernMode) ? parsed.modernMode : fallback.modernMode,
      };
    } catch {
      // Ignore malformed stored payload; fall back to migration or defaults.
    }
  }

  const migrated = migrateLegacyAppearance();
  if (migrated) {
    saveAppearance(migrated);
    return migrated;
  }

  const def = defaultAppearance();
  saveAppearance(def);
  return def;
}

export function saveAppearance(appearance: AppearanceState): void {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    // Swallow quota / disabled-storage errors.
  }
}

export function resolveMode(appearance: AppearanceState): KindleMode | ModernMode {
  return appearance.skin === 'kindle' ? appearance.kindleMode : appearance.modernMode;
}
