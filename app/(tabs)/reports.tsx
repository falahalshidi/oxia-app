import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { useBand } from '@/contexts/BandContext';
import { useSensorData } from '@/contexts/SensorDataContext';

const SCREEN_WIDTH = Dimensions.get('window').width - 48;

export default function ReportsScreen() {
  const { bandState } = useBand();
  const { recentReadings, isLoading, errorMessage, airQualityAvailable } = useSensorData();
  const backgroundColor = '#EFF6FF';
  const visibleReadings = useMemo(
    () => (bandState.isConnected ? recentReadings : []),
    [bandState.isConnected, recentReadings],
  );

  const chartData = useMemo(() => {
    const labels = visibleReadings.map((reading) =>
      new Intl.DateTimeFormat('ar', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(reading.createdAt)),
    );

    const temperature = visibleReadings.map((reading) => Number(reading.temperature.toFixed(1)));
    const humidity = visibleReadings.map((reading) => Number(reading.humidity.toFixed(1)));

    const average = {
      temperature:
        temperature.length > 0
          ? Number((temperature.reduce((acc, value) => acc + value, 0) / temperature.length).toFixed(1))
          : null,
      humidity:
        humidity.length > 0
          ? Number((humidity.reduce((acc, value) => acc + value, 0) / humidity.length).toFixed(1))
          : null,
    };

    return {
      chart: {
        labels: labels.length > 0 ? labels : ['--'],
        datasets: [
          {
            data: temperature.length > 0 ? temperature : [0],
            color: () => '#F28B54',
            strokeWidth: 3,
          },
          {
            data: humidity.length > 0 ? humidity : [0],
            color: () => '#4A90E2',
            strokeWidth: 3,
          },
        ],
        legend: ['الحرارة', 'الرطوبة'],
      },
      average,
    };
  }, [visibleReadings]);

  const summaryText = !bandState.isConnected
    ? 'اربط السوار أولًا لعرض سجل الجهاز المتصل'
    : isLoading
      ? 'جاري تحميل السجل المباشر من Supabase...'
      : recentReadings.length === 0
        ? 'لا توجد قراءات تاريخية للجهاز المتصل حاليًا'
        : 'آخر 7 قراءات محفوظة في قاعدة البيانات للجهاز المتصل';

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <Text style={styles.title}>التقارير المباشرة</Text>
      <Text style={styles.subtitle}>{summaryText}</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.chartCard}>
        <LineChart
          data={chartData.chart}
          width={SCREEN_WIDTH}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(68, 68, 68, ${opacity})`,
            labelColor: () => '#888888',
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#FFFFFF',
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: '#E8E8E8',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.summaryWrapper}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>متوسط الحرارة</Text>
          <Text style={styles.summaryValue}>
            {chartData.average.temperature !== null ? `${chartData.average.temperature} °م` : '--'}
          </Text>
          <Text style={styles.summaryHint}>محسوب من آخر 7 قراءات حقيقية</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>متوسط الرطوبة</Text>
          <Text style={styles.summaryValue}>
            {chartData.average.humidity !== null ? `${chartData.average.humidity}%` : '--'}
          </Text>
          <Text style={styles.summaryHint}>محسوب من آخر 7 قراءات حقيقية</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>جودة الهواء</Text>
          <Text style={styles.summaryValueMuted}>{airQualityAvailable ? 'متوفر' : '--'}</Text>
          {airQualityAvailable ? <Text style={styles.summaryHint}>متصل ببيانات المستشعر</Text> : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#444444',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: '#C43D3D',
    textAlign: 'center',
    lineHeight: 20,
  },
  chartCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
  },
  summaryWrapper: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#444444',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4A90E2',
    marginTop: 8,
  },
  summaryValueMuted: {
    fontSize: 26,
    fontWeight: '700',
    color: '#8A9EB6',
    marginTop: 8,
  },
  summaryHint: {
    fontSize: 14,
    color: '#777777',
    marginTop: 6,
  },
});
