import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'oxia_settings';

type ThemeOption = 'white' | 'blue';

type SettingsState = {
  theme: ThemeOption;
  guardianNumber: string;
};

type SettingsContextValue = {
  settings: SettingsState;
  setTheme: (value: ThemeOption) => void;
  setGuardianNumber: (value: string) => void;
  isLoading: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'white',
  guardianNumber: '0550000000',
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    const restoreSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<SettingsState>;
          setSettings({
            theme: parsed.theme === 'blue' ? 'blue' : 'white',
            guardianNumber:
              typeof parsed.guardianNumber === 'string' && parsed.guardianNumber.trim().length > 0
                ? parsed.guardianNumber
                : DEFAULT_SETTINGS.guardianNumber,
          });
        }
      } catch (error) {
        console.warn('Failed to restore settings', error);
      } finally {
        setHasRestored(true);
        setIsLoading(false);
      }
    };

    restoreSettings();
  }, []);

  useEffect(() => {
    if (!hasRestored) {
      return;
    }

    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to persist settings', error);
      }
    };

    void persist();
  }, [settings, hasRestored]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setTheme: (value) => setSettings((prev) => ({ ...prev, theme: value })),
      setGuardianNumber: (value) => setSettings((prev) => ({ ...prev, guardianNumber: value })),
      isLoading,
    }),
    [settings, isLoading],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }

  return context;
};
