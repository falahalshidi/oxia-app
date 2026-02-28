import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useProfile } from '@/contexts/ProfileContext';

export default function RootIndex() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#0A64C8" />
      </View>
    );
  }

  return <Redirect href={profile.completed ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
