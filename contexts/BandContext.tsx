import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'oxia_band_state';

type BandState = {
  isConnected: boolean;
  bandName: string | null;
  connectedAt: number | null;
};

type BandContextValue = {
  bandState: BandState;
  connectBand: (name: string) => void;
  disconnectBand: () => void;
  isLoading: boolean;
};

const DEFAULT_BAND_STATE: BandState = {
  isConnected: false,
  bandName: null,
  connectedAt: null,
};

const BandContext = createContext<BandContextValue | undefined>(undefined);

export const BandProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [bandState, setBandState] = useState<BandState>(DEFAULT_BAND_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    const restoreBandState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<BandState>;
          setBandState({
            isConnected: Boolean(parsed.isConnected),
            bandName: typeof parsed.bandName === 'string' ? parsed.bandName : null,
            connectedAt: typeof parsed.connectedAt === 'number' ? parsed.connectedAt : null,
          });
        }
      } catch (error) {
        console.warn('Failed to restore band state', error);
      } finally {
        setHasRestored(true);
        setIsLoading(false);
      }
    };

    void restoreBandState();
  }, []);

  useEffect(() => {
    if (!hasRestored) {
      return;
    }

    const persistBandState = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bandState));
      } catch (error) {
        console.warn('Failed to persist band state', error);
      }
    };

    void persistBandState();
  }, [bandState, hasRestored]);

  const value = useMemo<BandContextValue>(
    () => ({
      bandState,
      connectBand: (name) =>
        setBandState({
          isConnected: true,
          bandName: name,
          connectedAt: Date.now(),
        }),
      disconnectBand: () => setBandState(DEFAULT_BAND_STATE),
      isLoading,
    }),
    [bandState, isLoading],
  );

  return <BandContext.Provider value={value}>{children}</BandContext.Provider>;
};

export const useBand = () => {
  const context = useContext(BandContext);
  if (!context) {
    throw new Error('useBand must be used inside BandProvider');
  }

  return context;
};
