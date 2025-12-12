import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/contexts/SettingsContext';

const tipsList = [
  'طريقة استخدام البخاخ بشكل صحيح للحصول على أفضل نتيجة.',
  'تمارين تنفس بسيطة: شهيق عميق لخمس ثوانٍ، زفير بطيء لخمس ثوانٍ.',
  'تجنب الغبار والدخان وابقَ في أماكن جيدة التهوية.',
  'الحرص على شرب الماء للحفاظ على ترطيب الجسم.',
  'القيام بتمارين الإطالة الخفيفة لتحسين الاسترخاء.',
  'التأكد من نظافة مرشحات الهواء في المنزل بشكل منتظم.',
];

export default function TipsScreen() {
  const { settings } = useSettings();
  const backgroundColor = settings.theme === 'blue' ? '#F1F7FF' : '#FFFFFF';

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <Text style={styles.title}>نصائح يومية</Text>
      <Text style={styles.subtitle}>مجموعة من الإرشادات القصيرة للحفاظ على راحتك وصحتك</Text>

      <View style={styles.tipsWrapper}>
        {tipsList.map((tip, index) => (
          <View key={tip} style={styles.tipCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
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
  tipsWrapper: {
    gap: 16,
  },
  tipCard: {
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
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#444444',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8EC5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
