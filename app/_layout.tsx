import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BandProvider } from '@/contexts/BandContext';
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

export const unstable_settings = {
  anchor: 'onboarding',
};

function AppNavigator() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#0A64C8" />
      </View>
    );
  }

  return (
    <Stack initialRouteName={profile.completed ? '(tabs)' : 'onboarding'}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bracelet" options={{ title: 'ربط السوار' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#FFFFFF',
      card: '#FFFFFF',
      text: '#444444',
      primary: '#8EC5FC',
      border: '#E0E0E0',
    },
  };

  return (
    <SettingsProvider>
      <ProfileProvider>
        <BandProvider>
          <ThemeProvider value={theme}>
            <AppNavigator />
            <StatusBar style="dark" />
          </ThemeProvider>
        </BandProvider>
      </ProfileProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
