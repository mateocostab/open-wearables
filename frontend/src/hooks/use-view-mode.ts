import { useState, useCallback } from 'react';

export type ViewMode = 'simple' | 'advanced';

const STORAGE_KEY = 'healthos-view-mode';

function getStoredMode(): ViewMode {
  if (typeof window === 'undefined') return 'simple';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'advanced' ? 'advanced' : 'simple';
}

export function useViewMode() {
  const [mode, setModeState] = useState<ViewMode>(getStoredMode);

  const setMode = useCallback((newMode: ViewMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'simple' ? 'advanced' : 'simple');
  }, [mode, setMode]);

  return { mode, setMode, toggle, isAdvanced: mode === 'advanced' };
}
