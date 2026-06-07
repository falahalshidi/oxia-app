import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useBand } from '@/contexts/BandContext';
import { buildHealthAlertBody, getHealthAlerts } from '@/lib/healthAlerts';
import { supabase, supabaseKey, supabaseUrl } from '@/lib/supabase';

type SensorRow = {
  id: number;
  device_id: string;
  temperature: number;
  humidity: number;
  created_at: string;
  gas: number | null;
};

export type SensorReading = {
  id: number;
  deviceId: string;
  temperature: number;
  humidity: number;
  gas: number | null;
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
  saveSensorReading: (input: { deviceId: string; temperature: number; humidity: number; gas?: number }) => Promise<void>;
};

const SensorDataContext = createContext<SensorDataContextValue | undefined>(undefined);

const toSensorReading = (row: SensorRow): SensorReading => ({
  id: row.id,
  deviceId: row.device_id,
  temperature: row.temperature,
  humidity: row.humidity,
  gas: typeof row.gas === 'number' ? row.gas : null,
  createdAt: row.created_at,
});

const restSupabaseUrl = supabaseUrl as string;
const restSupabaseKey = supabaseKey as string;

const sensorDataHeaders = {
  apikey: restSupabaseKey,
  Authorization: `Bearer ${restSupabaseKey}`,
  'Content-Type': 'application/json',
};

const fetchSensorRows = async (deviceId?: string | null) => {
  const params = new URLSearchParams({
    select: 'id,device_id,temperature,humidity,gas,created_at',
    order: 'created_at.desc',
    limit: '50',
  });

  if (deviceId) {
    params.set('device_id', `eq.${deviceId}`);
  }

  const response = await fetch(`${restSupabaseUrl}/rest/v1/sensor_data?${params.toString()}`, {
    headers: sensorDataHeaders,
  });

  if (!response.ok) {
    throw new Error(`Readings request failed: ${response.status}`);
  }

  return (await response.json()) as SensorRow[];
};

const fetchDeviceRows = async () => {
  const params = new URLSearchParams({
    select: 'device_id,created_at',
    order: 'created_at.desc',
    limit: '50',
  });

  const response = await fetch(`${restSupabaseUrl}/rest/v1/sensor_data?${params.toString()}`, {
    headers: sensorDataHeaders,
  });

  if (!response.ok) {
    throw new Error(`Devices request failed: ${response.status}`);
  }

  return (await response.json()) as Pick<SensorRow, 'device_id' | 'created_at'>[];
};

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

    const loadSensorData = async (silent = false) => {
      try {
        if (isMounted && !silent) {
          setIsLoading(true);
          setErrorMessage(null);
        }

        const [deviceRows, readingRows] = await Promise.all([
          fetchDeviceRows(),
          fetchSensorRows(bandState.isConnected ? bandState.bandName : null),
        ]);

        if (!isMounted) {
          return;
        }

        const deviceList = Array.from(new Set((deviceRows ?? []).map((row) => row.device_id).filter(Boolean)));
        const mappedReadings = (readingRows ?? []).map((row) => toSensorReading(row as SensorRow));

        setAvailableDevices(deviceList);
        setCurrentReading(mappedReadings[0] ?? null);
        setRecentReadings(mappedReadings.slice(0, 7).reverse());
        setLastUpdatedAt(mappedReadings[0]?.createdAt ?? null);
        setErrorMessage(null);
      } catch (error) {
        console.warn('Failed to load sensor data', error);
        if (isMounted) {
          setErrorMessage('تعذر تحميل القراءات من Supabase.');
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    void loadSensorData();

    const channel = supabase
      .channel(`sensor-data-live-${bandState.bandName ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_data' },
        () => {
          void loadSensorData(true);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sensor_data' },
        () => {
          void loadSensorData(true);
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'sensor_data' },
        () => {
          void loadSensorData(true);
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          void loadSensorData(true);
        }
      });

    const pollInterval = setInterval(() => {
      void loadSensorData(true);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
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

  const saveSensorReading = async ({
    deviceId,
    temperature,
    humidity,
    gas = 0,
  }: {
    deviceId: string;
    temperature: number;
    humidity: number;
    gas?: number;
  }) => {
    const response = await fetch(`${restSupabaseUrl}/rest/v1/sensor_data`, {
      method: 'POST',
      headers: {
        ...sensorDataHeaders,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        device_id: deviceId,
        temperature: Number(temperature.toFixed(2)),
        humidity: Number(humidity.toFixed(2)),
        gas,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Insert failed: ${response.status} ${body}`);
    }
  };

  const value = useMemo<SensorDataContextValue>(
    () => ({
      currentReading,
      recentReadings,
      availableDevices,
      isLoading,
      errorMessage,
      lastUpdatedAt,
      airQualityAvailable: typeof currentReading?.gas === 'number',
      saveSensorReading,
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
