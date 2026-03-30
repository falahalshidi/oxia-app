import * as Notifications from 'expo-notifications';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { BandProvider } from '@/contexts/BandContext';
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext';
import { SensorDataProvider } from '@/contexts/SensorDataContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

export const unstable_settings = {
  anchor: 'onboarding',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
    <Stack initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
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

  useEffect(() => {
    const configureNotifications = async () => {
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted && permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: true,
          },
        });
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('health-alerts', {
          name: 'Health Alerts',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    };

    void configureNotifications();
  }, []);

  return (
    <SettingsProvider>
      <ProfileProvider>
        <BandProvider>
          <SensorDataProvider>
            <ThemeProvider value={theme}>
              <AppNavigator />
              <StatusBar style="dark" />
            </ThemeProvider>
          </SensorDataProvider>
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
