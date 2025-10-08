import { useCallback } from 'react';
import type { GlobalSettings } from './types';

export function useGlobalSettings(
  setGlobal: React.Dispatch<React.SetStateAction<GlobalSettings>>,
  markAllScreenshotsDirty: () => void
) {
  const updateBackground = useCallback((settings: Partial<GlobalSettings>) => {
    markAllScreenshotsDirty();
    setGlobal(prev => ({ ...prev, ...settings }));
  }, [setGlobal, markAllScreenshotsDirty]);

  const updateDeviceFrame = useCallback((device: string) => {
    markAllScreenshotsDirty();
    setGlobal(prev => ({ ...prev, deviceFrame: device }));
  }, [setGlobal, markAllScreenshotsDirty]);

  return {
    updateBackground,
    updateDeviceFrame,
  };
}
