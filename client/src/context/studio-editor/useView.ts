import { useCallback } from 'react';
import type { ViewState } from './types';

export function useView(
  setView: React.Dispatch<React.SetStateAction<ViewState>>
) {
  const setZoom = useCallback((zoom: number) => {
    setView(prev => ({ ...prev, zoom }));
  }, [setView]);

  const setPan = useCallback((x: number, y: number) => {
    setView(prev => ({ ...prev, panX: x, panY: y }));
  }, [setView]);

  const resetView = useCallback(() => {
    setView({ zoom: 1, panX: 0, panY: 0 });
  }, [setView]);

  return {
    setZoom,
    setPan,
    resetView,
  };
}
