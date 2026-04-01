import { useState, useEffect, useCallback } from 'react';
import type { ThemeMode } from '../types';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'auto' ? getSystemTheme() : mode;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('kindle-stats-theme');
    return (stored as ThemeMode) || 'auto';
  });

  const [resolved, setResolved] = useState<'light' | 'dark'>(() => getResolvedTheme(mode));

  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
    setResolved(theme);
  }, []);

  useEffect(() => {
    applyTheme(getResolvedTheme(mode));
    localStorage.setItem('kindle-stats-theme', mode);

    if (mode === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode, applyTheme]);

  const cycleTheme = useCallback(() => {
    setMode(prev => {
      const order: ThemeMode[] = ['auto', 'light', 'dark'];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  }, []);

  return { mode, resolved, setMode, cycleTheme };
}
