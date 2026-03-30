import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ActivityLevel, SleepQuality, useProfile } from '@/contexts/ProfileContext';

const triggerOptions = ['الغبار', 'الدخان', 'الروائح القوية', 'الطقس البارد', 'الجهد العالي'];
const symptomOptions = ['ضيق نفس', 'سعال', 'صفير بالصدر', 'تعب سريع', 'تحسس بالأنف'];

const activityOptions: { id: ActivityLevel; label: string }[] = [
  { id: 'low', label: 'منخفض' },
  { id: 'medium', label: 'متوسط' },
  { id: 'high', label: 'عالٍ' },
];

const sleepOptions: { id: SleepQuality; label: string }[] = [
  { id: 'poor', label: 'ضعيفة' },
  { id: 'average', label: 'متوسطة' },
  { id: 'good', label: 'جيدة' },
];

const toggleListItem = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, isLoading, saveProfile } = useProfile();

  const [age, setAge] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && profile.completed) {
      router.replace('/');
    }
  }, [isLoading, profile.completed, router]);

  const isValid = useMemo(() => {
    const ageNumber = Number(age);
    return ageNumber >= 5 && ageNumber <= 100 && activityLevel && sleepQuality;
  }, [age, activityLevel, sleepQuality]);

  const handleSave = async () => {
    if (!isValid || !activityLevel || !sleepQuality) {
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile({
        age: age.trim(),
        activityLevel,
        sleepQuality,
        triggers,
        symptoms,
      });
      router.replace('/');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#0A64C8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>أهلاً بك في نفس</Text>
        <Text style={styles.subtitle}>أجب عن أسئلة البداية حتى نفهم سلوكك والعوامل التي تؤثر عليك</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>العمر</Text>
        <Text style={styles.cardHint}>أدخل عمرك الحقيقي حتى تكون القراءة أقرب لوضعك</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={age}
          onChangeText={(value) => setAge(value.replace(/[^0-9]/g, ''))}
          placeholder="مثال: 24"
          placeholderTextColor="#97ACC4"
          maxLength={3}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>مستوى النشاط اليومي</Text>
        <View style={styles.optionsRow}>
          {activityOptions.map((option) => {
            const isActive = activityLevel === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionChip, isActive && styles.optionChipActive]}
                onPress={() => setActivityLevel(option.id)}
                activeOpacity={0.85}>
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>جودة النوم</Text>
        <View style={styles.optionsRow}>
          {sleepOptions.map((option) => {
            const isActive = sleepQuality === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionChip, isActive && styles.optionChipActive]}
                onPress={() => setSleepQuality(option.id)}
                activeOpacity={0.85}>
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>العوامل التي تؤثر عليك</Text>
        <Text style={styles.cardHint}>يمكن اختيار أكثر من عامل</Text>
        <View style={styles.optionsWrap}>
          {triggerOptions.map((item) => {
            const isActive = triggers.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.multiChip, isActive && styles.multiChipActive]}
                onPress={() => setTriggers((prev) => toggleListItem(prev, item))}
                activeOpacity={0.85}>
                <Text style={[styles.multiChipText, isActive && styles.multiChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>أعراض تتكرر عندك</Text>
        <Text style={styles.cardHint}>اختياري - يساعدنا في فهم سلوك الحالة</Text>
        <View style={styles.optionsWrap}>
          {symptomOptions.map((item) => {
            const isActive = symptoms.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.multiChip, isActive && styles.multiChipActive]}
                onPress={() => setSymptoms((prev) => toggleListItem(prev, item))}
                activeOpacity={0.85}>
                <Text style={[styles.multiChipText, isActive && styles.multiChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (!isValid || isSaving) && styles.submitButtonDisabled]}
        onPress={handleSave}
        disabled={!isValid || isSaving}
        activeOpacity={0.9}>
        <Text style={styles.submitButtonText}>{isSaving ? 'جاري الحفظ...' : 'بدء استخدام التطبيق'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  content: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEAFF',
    borderRadius: 22,
    padding: 18,
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#163A61',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#5D7EA0',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DEEBFF',
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E466E',
  },
  cardHint: {
    fontSize: 14,
    color: '#6E8FB1',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7E6FA',
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    fontSize: 18,
    color: '#214466',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1E2F7',
    backgroundColor: '#F4F8FF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionChipActive: {
    backgroundColor: '#0A64C8',
    borderColor: '#0A64C8',
  },
  optionText: {
    fontSize: 15,
    color: '#466A8F',
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  optionsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  multiChip: {
    borderWidth: 1,
    borderColor: '#D4E4F8',
    backgroundColor: '#F3F8FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  multiChipActive: {
    backgroundColor: '#0A64C8',
    borderColor: '#0A64C8',
  },
  multiChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#406387',
  },
  multiChipTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0A64C8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9AB8DA',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
