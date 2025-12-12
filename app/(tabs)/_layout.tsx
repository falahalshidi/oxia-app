import { Tabs } from 'expo-router';
import React from 'react';

import { OxiaTabBar } from '@/components/OxiaTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <OxiaTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarLabel: 'الرئيسية',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'التقارير',
          tabBarLabel: 'التقارير',
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          title: 'نصائح',
          tabBarLabel: 'نصائح',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الإعدادات',
          tabBarLabel: 'الإعدادات',
        }}
      />
    </Tabs>
  );
}
