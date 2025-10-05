import { useCallback } from 'react';
import type { GlobalSettings } from './types';

export function useGlobalSettings(
  setGlobal: React.Dispatch<React.SetStateAction<GlobalSettings>>
) {
  const updateBackground = useCallback((settings: Partial<GlobalSettings>) => {
    setGlobal(prev => ({ ...prev, ...settings }));
  }, [setGlobal]);

  const updateDeviceFrame = useCallback((device: string) => {
    setGlobal(prev => ({ ...prev, deviceFrame: device }));
  }, [setGlobal]);

  return {
    updateBackground,
    updateDeviceFrame,
  };
}
