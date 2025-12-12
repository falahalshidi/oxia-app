import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSettings } from '@/contexts/SettingsContext';

const themeOptions = [
  { id: 'white', label: 'أبيض' },
  { id: 'blue', label: 'أزرق فاتح' },
] as const;

export default function SettingsScreen() {
  const { settings, setTheme, setAlertsEnabled, setGuardianNumber, isLoading } = useSettings();
  const [guardianInput, setGuardianInput] = useState(settings.guardianNumber);

  useEffect(() => {
    setGuardianInput(settings.guardianNumber);
  }, [settings.guardianNumber]);

  const backgroundColor = settings.theme === 'blue' ? '#F1F7FF' : '#FFFFFF';

  const handleGuardianBlur = () => {
    const sanitized = guardianInput.trim();
    if (sanitized.length > 0 && sanitized !== settings.guardianNumber) {
      setGuardianNumber(sanitized);
    } else {
      setGuardianInput(settings.guardianNumber);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <Text style={styles.title}>الإعدادات</Text>
      <Text style={styles.subtitle}>عدل خيارات Oxia بما يتناسب مع راحتك</Text>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#8EC5FC" />
          <Text style={styles.loaderText}>جاري تحميل الإعدادات...</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>اللون العام للتطبيق</Text>
            <Text style={styles.cardHint}>اختر بين خلفية بيضاء أو زرقاء هادئة</Text>
            <View style={styles.themeOptions}>
              {themeOptions.map((option) => {
                const isActive = settings.theme === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.themeOption, isActive && styles.themeOptionActive]}
                    onPress={() => setTheme(option.id)}
                    activeOpacity={0.8}>
                    <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>التنبيهات</Text>
            <Text style={styles.cardHint}>تفعيل أو إيقاف تنبيهات القيم غير الطبيعية</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>التنبيهات مفعلة</Text>
              <Switch
                value={settings.alertsEnabled}
                onValueChange={(value) => setAlertsEnabled(value)}
                trackColor={{ true: '#8EC5FC', false: '#CCCCCC' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>رقم ولي الأمر</Text>
            <Text style={styles.cardHint}>يبقى الرقم محفوظًا محليًا داخل التطبيق فقط</Text>
            <TextInput
              style={styles.input}
              value={guardianInput}
              onChangeText={setGuardianInput}
              keyboardType="phone-pad"
              onBlur={handleGuardianBlur}
              placeholder="أدخل رقم ولي الأمر"
              placeholderTextColor="#AAAAAA"
            />
          </View>
        </>
      )}
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
  },
  loader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#666666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444444',
  },
  cardHint: {
    fontSize: 14,
    color: '#777777',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F8F8F8',
  },
  themeOptionActive: {
    backgroundColor: '#8EC5FC',
    borderColor: '#8EC5FC',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  themeOptionTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#444444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#444444',
    backgroundColor: '#FFFFFF',
  },
});
