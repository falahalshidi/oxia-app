import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useBand } from '@/contexts/BandContext';
import { useSensorData } from '@/contexts/SensorDataContext';

const getDeviceDisplayName = (deviceId: string) => (deviceId.toLowerCase() === 'esp32_01' ? 'نفس' : deviceId);

export default function BraceletScreen() {
  const router = useRouter();
  const { bandState, connectBand, disconnectBand, isLoading } = useBand();
  const { availableDevices, isLoading: isSensorLoading } = useSensorData();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const connectedLabel = useMemo(() => {
    if (!bandState.connectedAt) {
      return 'تم الاتصال بنجاح';
    }

    const date = new Date(bandState.connectedAt);
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `تم الاتصال بنجاح - ${hours}:${minutes}`;
  }, [bandState.connectedAt]);

  const handleConnect = (bandName: string, id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      connectBand(bandName);
      setConnectingId(null);
      Alert.alert('نجاح الربط', `تم الاتصال بـ ${bandName}`);
      router.back();
    }, 1200);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>ربط السوار الذكي</Text>
        <Text style={styles.subtitle}>الأجهزة هنا تُقرأ مباشرة من Supabase وليس من بيانات وهمية</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>حالة الاتصال</Text>
        <Text style={[styles.statusValue, bandState.isConnected ? styles.connectedText : styles.disconnectedText]}>
          {isLoading ? 'جاري التحميل...' : bandState.isConnected ? connectedLabel : 'غير متصل'}
        </Text>
        {bandState.isConnected ? (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectBand} activeOpacity={0.85}>
            <Text style={styles.disconnectButtonText}>فصل الاتصال</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>الأجهزة المتاحة</Text>

      {isSensorLoading ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator size="small" color="#0A64C8" />
          <Text style={styles.emptyText}>جاري تحميل الأجهزة من قاعدة البيانات...</Text>
        </View>
      ) : null}

      {!isSensorLoading && availableDevices.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>لا توجد أجهزة متاحة حاليًا في جدول `sensor_data`.</Text>
        </View>
      ) : null}

      {availableDevices.map((deviceId) => {
        const isConnecting = connectingId === deviceId;
        const isCurrent = bandState.bandName === deviceId && bandState.isConnected;
        const displayName = getDeviceDisplayName(deviceId);

        return (
          <View key={deviceId} style={styles.bandCard}>
            <View style={styles.bandHeader}>
              <Text style={styles.bandName}>{displayName}</Text>
              <View style={styles.signalPill}>
                <Text style={styles.signalText}>بث مباشر</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.connectButton, isCurrent && styles.connectedButton]}
              onPress={() => handleConnect(deviceId, deviceId)}
              disabled={isConnecting || isCurrent || isLoading}
              activeOpacity={0.9}>
              {isConnecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.connectButtonText}>{isCurrent ? 'متصل الآن' : 'ربط السوار'}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCEAFF',
    padding: 18,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#15385F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5E7FA1',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCEAFF',
    gap: 10,
  },
  statusTitle: {
    fontSize: 16,
    color: '#315779',
    fontWeight: '700',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  connectedText: {
    color: '#1D9552',
  },
  disconnectedText: {
    color: '#BA3A3A',
  },
  disconnectButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: '#FEECEC',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disconnectButtonText: {
    color: '#B73434',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DEEBFF',
    padding: 18,
    gap: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#5E7FA1',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C466F',
    marginTop: 4,
  },
  bandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DEEBFF',
    padding: 14,
    gap: 12,
  },
  bandHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#133D68',
  },
  signalPill: {
    backgroundColor: '#E9F3FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  signalText: {
    color: '#3B618A',
    fontSize: 12,
    fontWeight: '600',
  },
  connectButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0A64C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedButton: {
    backgroundColor: '#2A9D5F',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
