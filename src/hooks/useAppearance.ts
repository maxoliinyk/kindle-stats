import { useCallback, useEffect, useState } from 'react';
import type { AppearanceState, KindleMode, ModernMode, Skin } from '../types';
import { getStoredAppearance, resolveMode, saveAppearance } from '../theme';

function applyAppearance(appearance: AppearanceState) {
  const root = document.documentElement;
  root.setAttribute('data-skin', appearance.skin);
  root.setAttribute('data-theme', resolveMode(appearance));
}

export function useAppearance() {
  const [appearance, setAppearance] = useState<AppearanceState>(() => getStoredAppearance());

  useEffect(() => {
    applyAppearance(appearance);
    saveAppearance(appearance);
  }, [appearance]);

  const setSkin = useCallback((skin: Skin) => {
    setAppearance(prev => (prev.skin === skin ? prev : { ...prev, skin }));
  }, []);

  const setKindleMode = useCallback((mode: KindleMode) => {
    setAppearance(prev => (prev.kindleMode === mode ? prev : { ...prev, kindleMode: mode }));
  }, []);

  const setModernMode = useCallback((mode: ModernMode) => {
    setAppearance(prev => (prev.modernMode === mode ? prev : { ...prev, modernMode: mode }));
  }, []);

  const setModeForCurrentSkin = useCallback((mode: KindleMode | ModernMode) => {
    setAppearance(prev => {
      if (prev.skin === 'kindle') {
        return { ...prev, kindleMode: mode as KindleMode };
      }
      return { ...prev, modernMode: mode as ModernMode };
    });
  }, []);

  return {
    skin: appearance.skin,
    kindleMode: appearance.kindleMode,
    modernMode: appearance.modernMode,
    mode: resolveMode(appearance),
    setSkin,
    setKindleMode,
    setModernMode,
    setModeForCurrentSkin,
  };
}
