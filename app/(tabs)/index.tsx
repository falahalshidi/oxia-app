import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useBand } from '@/contexts/BandContext';
import { useSensorData } from '@/contexts/SensorDataContext';
import { useSettings } from '@/contexts/SettingsContext';

type MetricKey = 'airQuality' | 'temperature' | 'humidity';

const THRESHOLDS: Record<Exclude<MetricKey, 'airQuality'>, { min: number; max: number }> = {
  temperature: {
    min: 18,
    max: 30,
  },
  humidity: {
    min: 30,
    max: 70,
  },
};

const AMBULANCE_NUMBER = '997';

const metricTitle: Record<MetricKey, string> = {
  airQuality: 'جودة الهواء',
  temperature: 'درجة الحرارة',
  humidity: 'الرطوبة',
};

const getDeviceDisplayName = (deviceId: string) => (deviceId.toLowerCase() === 'esp32_01' ? 'نفس' : deviceId);

const formatLastUpdated = (value: string | null) => {
  if (!value) {
    return 'لا توجد قراءة بعد';
  }

  return new Intl.DateTimeFormat('ar', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
};

export default function HomeScreen() {
  const { settings } = useSettings();
  const { bandState, isLoading: isBandLoading } = useBand();
  const { currentReading, isLoading, errorMessage, lastUpdatedAt, airQualityAvailable } = useSensorData();
  const router = useRouter();
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  const backgroundColor = '#EFF6FF';

  const activeMetrics = useMemo(
    () => ({
      temperature: bandState.isConnected ? currentReading?.temperature ?? null : null,
      humidity: bandState.isConnected ? currentReading?.humidity ?? null : null,
    }),
    [bandState.isConnected, currentReading?.humidity, currentReading?.temperature],
  );

  const handleCall = async (phone: string) => {
    try {
      const canOpen = await Linking.canOpenURL(`tel:${phone}`);
      if (canOpen) {
        await Linking.openURL(`tel:${phone}`);
      } else {
        Alert.alert('تعذر إجراء الاتصال', 'يرجى المحاولة مرة أخرى لاحقًا.');
      }
    } catch (error) {
      console.warn('Call failed', error);
      Alert.alert('تعذر إجراء الاتصال', 'يرجى المحاولة مرة أخرى لاحقًا.');
    }
  };

  const handleShareLocation = async () => {
    try {
      setIsSharingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('إذن الموقع مرفوض', 'لا يمكن مشاركة الموقع بدون منح الإذن.');
        return;
      }

      const position = await Location.getCurrentPositionAsync();
      const { latitude, longitude } = position.coords;
      const message = `موقعي الحالي: https://maps.google.com/?q=${latitude},${longitude}`;
      await Share.share({ message });
    } catch (error) {
      console.warn('Share location failed', error);
      Alert.alert('خطأ في مشاركة الموقع', 'تعذر الحصول على الموقع الحالي.');
    } finally {
      setIsSharingLocation(false);
    }
  };

  const renderMetricCard = (key: MetricKey) => {
    if (key === 'airQuality') {
      return (
        <View key={key} style={styles.metricCard}>
          <Text style={styles.metricTitle}>{metricTitle[key]}</Text>
          <Text style={styles.metricValueMuted}>{airQualityAvailable ? 'متوفر' : '--'}</Text>
          {airQualityAvailable ? (
            <Text style={[styles.metricStatus, styles.metricStatusMuted]}>القراءة مرتبطة بقاعدة البيانات</Text>
          ) : null}
        </View>
      );
    }

    const value = activeMetrics[key];
    const { min, max } = THRESHOLDS[key];
    const isConnected = bandState.isConnected;
    const hasValue = typeof value === 'number';
    const isNormal = hasValue && value >= min && value <= max;

    return (
      <View key={key} style={styles.metricCard}>
        <Text style={styles.metricTitle}>{metricTitle[key]}</Text>
        <Text style={styles.metricValue}>
          {hasValue ? value.toFixed(1) : '--'}
          {key === 'humidity' ? ' %' : ' °م'}
        </Text>
        <Text
          style={[
            styles.metricStatus,
            (!isConnected || !hasValue) && styles.metricStatusMuted,
            isConnected && hasValue && !isNormal && styles.metricStatusWarning,
          ]}>
          {!isConnected
            ? 'بانتظار ربط السوار'
            : !hasValue
              ? isLoading
                ? 'جاري تحميل القراءة المباشرة...'
                : 'لا توجد قراءة حالية لهذا الجهاز'
              : isNormal
                ? 'الحالة مستقرة'
                : 'تنبيه: تحقق من الحالة'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>لوحة نفس</Text>
          <Text style={styles.subtitle}>قراءات مباشرة من Supabase تتحدث فور أي تغيير في sensor_data</Text>
          <View style={styles.connectionPill}>
            <View
              style={[
                styles.statusDot,
                bandState.isConnected && !isBandLoading ? styles.statusDotConnected : styles.statusDotDisconnected,
              ]}
            />
            <Text style={styles.connectionText}>
              {isBandLoading
                ? 'جاري تحميل حالة السوار...'
                : bandState.isConnected
                  ? `متصل: ${bandState.bandName ? getDeviceDisplayName(bandState.bandName) : 'الجهاز'}`
                  : 'غير متصل'}
            </Text>
          </View>
          <Text style={styles.updatedText}>آخر تحديث: {formatLastUpdated(lastUpdatedAt)}</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/bracelet')} activeOpacity={0.9}>
            <Text style={styles.connectButtonText}>
              {bandState.isConnected ? 'إدارة اتصال السوار' : 'ربط السوار الآن'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsWrapper}>
          {(['airQuality', 'temperature', 'humidity'] as MetricKey[]).map(renderMetricCard)}
        </View>

        <TouchableOpacity style={styles.sosButton} activeOpacity={0.85} onPress={() => setIsSosOpen(true)}>
          <Text style={styles.sosLabel}>SOS</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isSosOpen} transparent animationType="fade" onRequestClose={() => setIsSosOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إجراءات الطوارئ</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => handleCall(AMBULANCE_NUMBER)}>
              <Text style={styles.modalButtonText}>اتصال بالإسعاف</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => handleCall(settings.guardianNumber)}>
              <Text style={styles.modalButtonText}>اتصال بولي الأمر</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSecondaryButton]}
              onPress={handleShareLocation}
              disabled={isSharingLocation}>
              <Text style={styles.modalSecondaryText}>
                {isSharingLocation ? '...جاري مشاركة الموقع' : 'مشاركة الموقع الحالي'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setIsSosOpen(false)}>
              <Text style={styles.modalCloseText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DDEBFF',
    shadowColor: '#2B5C9B',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0E315A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#44698E',
    textAlign: 'center',
    lineHeight: 22,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
  },
  statusDotConnected: {
    backgroundColor: '#1DBE6F',
  },
  statusDotDisconnected: {
    backgroundColor: '#FF5A5A',
  },
  connectionText: {
    fontSize: 14,
    color: '#214466',
    fontWeight: '600',
  },
  updatedText: {
    textAlign: 'center',
    color: '#5A7899',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: '#C43D3D',
    fontSize: 13,
    lineHeight: 18,
  },
  connectButton: {
    marginTop: 4,
    backgroundColor: '#0A64C8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metricsWrapper: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E1ECFF',
    shadowColor: '#5B88C5',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#234A70',
  },
  metricValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0A64C8',
    marginTop: 8,
  },
  metricValueMuted: {
    fontSize: 34,
    fontWeight: '800',
    color: '#8A9EB6',
    marginTop: 8,
  },
  metricStatus: {
    marginTop: 8,
    fontSize: 14,
    color: '#2A8B55',
    fontWeight: '600',
  },
  metricStatusMuted: {
    color: '#8A9EB6',
  },
  metricStatusWarning: {
    color: '#D83C3C',
  },
  sosButton: {
    marginTop: 10,
    alignSelf: 'center',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#E33648',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A0E18',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  sosLabel: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 16, 34, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#183E65',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#0A64C8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSecondaryButton: {
    backgroundColor: '#EAF2FF',
  },
  modalSecondaryText: {
    color: '#375E8A',
    fontSize: 15,
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#3B4E63',
    fontWeight: '600',
  },
});
