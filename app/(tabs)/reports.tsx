import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { useSettings } from '@/contexts/SettingsContext';

const SCREEN_WIDTH = Dimensions.get('window').width - 48;

const randomRange = (min: number, max: number) =>
  Math.round(Math.random() * (max - min) + min);

const dayLabels = ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج'];

export default function ReportsScreen() {
  const { settings } = useSettings();
  const backgroundColor = settings.theme === 'blue' ? '#F1F7FF' : '#FFFFFF';

  const weeklyData = useMemo(() => {
    const airQuality = Array.from({ length: 7 }, () => randomRange(70, 150));
    const heartRate = Array.from({ length: 7 }, () => randomRange(60, 110));
    const humidity = Array.from({ length: 7 }, () => randomRange(35, 65));

    const average = {
      airQuality: Math.round(airQuality.reduce((acc, value) => acc + value, 0) / airQuality.length),
      heartRate: Math.round(heartRate.reduce((acc, value) => acc + value, 0) / heartRate.length),
      humidity: Math.round(humidity.reduce((acc, value) => acc + value, 0) / humidity.length),
    };

    return {
      chart: {
        labels: dayLabels,
        datasets: [
          {
            data: airQuality,
            color: () => '#8EC5FC',
            strokeWidth: 3,
          },
          {
            data: heartRate,
            color: () => '#70D6FF',
            strokeWidth: 3,
          },
          {
            data: humidity,
            color: () => '#4CAF50',
            strokeWidth: 3,
          },
        ],
        legend: ['جودة الهواء', 'نبض القلب', 'الرطوبة'],
      },
      average,
    };
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <Text style={styles.title}>تقارير الأسبوع</Text>
      <Text style={styles.subtitle}>ملخص سريع لقراءاتك المحلية خلال الأيام السبعة الماضية</Text>

      <View style={styles.chartCard}>
        <LineChart
          data={weeklyData.chart}
          width={SCREEN_WIDTH}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
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
          <Text style={styles.summaryTitle}>متوسط جودة الهواء</Text>
          <Text style={styles.summaryValue}>{weeklyData.average.airQuality} AQI</Text>
          <Text style={styles.summaryHint}>القيمة المثالية أقل من 150</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>متوسط نبض القلب</Text>
          <Text style={styles.summaryValue}>{weeklyData.average.heartRate} bpm</Text>
          <Text style={styles.summaryHint}>المعدل المريح بين 60 و 100</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>متوسط الرطوبة</Text>
          <Text style={styles.summaryValue}>{weeklyData.average.humidity}%</Text>
          <Text style={styles.summaryHint}>القيم المثلى بين 40% و 60%</Text>
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
    color: '#8EC5FC',
    marginTop: 8,
  },
  summaryHint: {
    fontSize: 14,
    color: '#777777',
    marginTop: 6,
  },
});
