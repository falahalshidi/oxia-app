import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';

const ACTIVE_COLOR = '#8EC5FC';
const INACTIVE_COLOR = '#A0A0A0';

const ICON_MAP = {
  index: 'house.fill',
  reports: 'chart.bar.fill',
  tips: 'lightbulb.fill',
  settings: 'gearshape.fill',
} as const;

export function OxiaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            (options.tabBarLabel as string) ??
            options.title ??
            (route.name.charAt(0).toUpperCase() + route.name.slice(1));

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = ICON_MAP[route.name as keyof typeof ICON_MAP];

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}>
              {iconName ? (
                <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
                  <IconSymbol
                    name={iconName}
                    size={24}
                    color={isFocused ? '#FFFFFF' : '#7E96B8'}
                  />
                </View>
              ) : null}
              <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F4F8FF',
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DFE9FF',
    shadowColor: '#8FA8D8',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tabItemActive: {
    backgroundColor: '#E5F1FF',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5FF',
  },
  iconWrapperActive: {
    backgroundColor: ACTIVE_COLOR,
  },
  label: {
    fontSize: 13,
    color: INACTIVE_COLOR,
    fontWeight: '600',
  },
  labelActive: {
    color: '#4075B6',
  },
});
