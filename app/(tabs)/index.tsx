import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSettings } from '@/contexts/SettingsContext';

type MetricKey = 'airQuality' | 'heartRate' | 'humidity';

type Metrics = Record<MetricKey, number>;

const INITIAL_METRICS: Metrics = {
  airQuality: 85,
  heartRate: 78,
  humidity: 48,
};

const THRESHOLDS: Record<MetricKey, { min: number; max: number; warning: string }> = {
  airQuality: {
    min: 0,
    max: 150,
    warning: 'تفيد البيانات بارتفاع في مؤشر جودة الهواء.',
  },
  heartRate: {
    min: 55,
    max: 120,
    warning: 'نبض القلب خارج المعدل الطبيعي.',
  },
  humidity: {
    min: 30,
    max: 70,
    warning: 'رطوبة الجو غير مناسبة.',
  },
};

const AMBULANCE_NUMBER = '997';

const randomShift = (current: number, min: number, max: number, variance: number) => {
  const shift = (Math.random() - 0.5) * variance;
  const next = Math.min(max, Math.max(min, current + shift));
  return Math.round(next);
};

const metricTitle: Record<MetricKey, string> = {
  airQuality: 'جودة الهواء',
  heartRate: 'نبض القلب',
  humidity: 'رطوبة الجو',
};

export default function HomeScreen() {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const lastAlerts = useRef<Record<MetricKey, number>>({
    airQuality: 0,
    heartRate: 0,
    humidity: 0,
  });

  const backgroundColor = settings.theme === 'blue' ? '#F1F7FF' : '#FFFFFF';

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const next: Metrics = {
          airQuality: randomShift(prev.airQuality, 40, 180, 16),
          heartRate: randomShift(prev.heartRate, 52, 140, 14),
          humidity: randomShift(prev.humidity, 25, 85, 10),
        };

        if (settings.alertsEnabled) {
          (Object.keys(next) as MetricKey[]).forEach((key) => {
            const { min, max, warning } = THRESHOLDS[key];
            if (next[key] < min || next[key] > max) {
              const last = lastAlerts.current[key];
              const now = Date.now();
              if (now - last > 30000) {
                Alert.alert('تنبيه صحي', warning);
                lastAlerts.current[key] = now;
              }
            }
          });
        }

        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [settings.alertsEnabled]);

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
    const value = metrics[key];
    const { min, max } = THRESHOLDS[key];
    const isNormal = value >= min && value <= max;

    return (
      <View key={key} style={styles.metricCard}>
        <Text style={styles.metricTitle}>{metricTitle[key]}</Text>
        <Text style={styles.metricValue}>
          {value}
          {key === 'heartRate' ? ' bpm' : key === 'humidity' ? ' %' : ' AQI'}
        </Text>
        <Text style={[styles.metricStatus, !isNormal && styles.metricStatusWarning]}>
          {isNormal ? 'الحالة مستقرة' : 'تنبيه: تحقق من الحالة'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Oxia</Text>
        <Text style={styles.subtitle}>متابعة هادئة لصحتك وجودة الهواء</Text>
      </View>

      <View style={styles.metricsWrapper}>{(Object.keys(metrics) as MetricKey[]).map(renderMetricCard)}</View>

      <TouchableOpacity style={styles.sosButton} activeOpacity={0.85} onPress={() => setIsSosOpen(true)}>
        <Text style={styles.sosLabel}>SOS</Text>
      </TouchableOpacity>

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
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#444444',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  metricsWrapper: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  metricTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444444',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8EC5FC',
    marginTop: 6,
  },
  metricStatus: {
    marginTop: 8,
    fontSize: 14,
    color: '#4CAF50',
  },
  metricStatusWarning: {
    color: '#E06666',
  },
  sosButton: {
    marginTop: 32,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8EC5FC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sosLabel: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    color: '#444444',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#8EC5FC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryButton: {
    backgroundColor: '#EAF2FF',
  },
  modalSecondaryText: {
    color: '#4A78A4',
    fontSize: 15,
    fontWeight: '500',
  },
  modalClose: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#444444',
  },
});
