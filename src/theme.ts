import type { ThemeMode } from './types';
import { THEME_STORAGE_KEY } from './storage';

const VALID_THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

function isThemeMode(value: string): value is ThemeMode {
  return VALID_THEME_MODES.includes(value as ThemeMode);
}

export function getStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (!stored) return 'auto';
  return isThemeMode(stored) ? stored : 'auto';
}
