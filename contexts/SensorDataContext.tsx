import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useBand } from '@/contexts/BandContext';
import { buildHealthAlertBody, getHealthAlerts } from '@/lib/healthAlerts';
import { supabase } from '@/lib/supabase';

type SensorRow = {
  id: number;
  device_id: string;
  temperature: number;
  humidity: number;
  created_at: string;
};

export type SensorReading = {
  id: number;
  deviceId: string;
  temperature: number;
  humidity: number;
  createdAt: string;
};

type SensorDataContextValue = {
  currentReading: SensorReading | null;
  recentReadings: SensorReading[];
  availableDevices: string[];
  isLoading: boolean;
  errorMessage: string | null;
  lastUpdatedAt: string | null;
  airQualityAvailable: boolean;
};

const SensorDataContext = createContext<SensorDataContextValue | undefined>(undefined);

const toSensorReading = (row: SensorRow): SensorReading => ({
  id: row.id,
  deviceId: row.device_id,
  temperature: row.temperature,
  humidity: row.humidity,
  createdAt: row.created_at,
});

export const SensorDataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { bandState } = useBand();
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([]);
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAlertSignature, setLastAlertSignature] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSensorData = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setErrorMessage(null);
        }

        const devicesQuery = supabase
          .from('sensor_data')
          .select('device_id, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        const readingsQuery = (() => {
          let query = supabase
            .from('sensor_data')
            .select('id, device_id, temperature, humidity, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

          if (bandState.isConnected && bandState.bandName) {
            query = query.eq('device_id', bandState.bandName);
          }

          return query;
        })();

        const [{ data: deviceRows, error: devicesError }, { data: readingRows, error: readingsError }] =
          await Promise.all([devicesQuery, readingsQuery]);

        if (devicesError) {
          throw devicesError;
        }

        if (readingsError) {
          throw readingsError;
        }

        if (!isMounted) {
          return;
        }

        const deviceList = Array.from(new Set((deviceRows ?? []).map((row) => row.device_id).filter(Boolean)));
        const mappedReadings = (readingRows ?? []).map((row) => toSensorReading(row as SensorRow));

        setAvailableDevices(deviceList);
        setCurrentReading(mappedReadings[0] ?? null);
        setRecentReadings(mappedReadings.slice(0, 7).reverse());
        setLastUpdatedAt(mappedReadings[0]?.createdAt ?? null);
      } catch (error) {
        console.warn('Failed to load sensor data', error);
        if (isMounted) {
          setErrorMessage('تعذر تحميل البيانات من قاعدة البيانات.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSensorData();

    const channel = supabase
      .channel(`sensor-data-live-${bandState.bandName ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_data' },
        () => {
          void loadSensorData();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [bandState.bandName, bandState.isConnected]);

  useEffect(() => {
    if (!bandState.isConnected || !currentReading) {
      return;
    }

    const alerts = getHealthAlerts(currentReading);
    if (alerts.length === 0) {
      return;
    }

    const signature = `${currentReading.id}:${alerts.map((alert) => alert.code).join(',')}`;
    if (lastAlertSignature === signature) {
      return;
    }

    setLastAlertSignature(signature);

    void Notifications.scheduleNotificationAsync({
      content: {
        title: 'تنبيه صحي من Oxia',
        body: buildHealthAlertBody(alerts),
        sound: 'default',
      },
      trigger: null,
    });
  }, [bandState.isConnected, currentReading, lastAlertSignature]);

  const value = useMemo<SensorDataContextValue>(
    () => ({
      currentReading,
      recentReadings,
      availableDevices,
      isLoading,
      errorMessage,
      lastUpdatedAt,
      airQualityAvailable: false,
    }),
    [availableDevices, currentReading, errorMessage, isLoading, lastUpdatedAt, recentReadings],
  );

  return <SensorDataContext.Provider value={value}>{children}</SensorDataContext.Provider>;
};

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used inside SensorDataProvider');
  }

  return context;
};
