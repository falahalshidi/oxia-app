import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'nafas_profile';

export type ActivityLevel = 'low' | 'medium' | 'high';
export type SleepQuality = 'poor' | 'average' | 'good';

export type UserProfile = {
  age: string;
  activityLevel: ActivityLevel | null;
  sleepQuality: SleepQuality | null;
  triggers: string[];
  symptoms: string[];
  completed: boolean;
};

type SaveProfileInput = {
  age: string;
  activityLevel: ActivityLevel;
  sleepQuality: SleepQuality;
  triggers: string[];
  symptoms: string[];
};

type ProfileContextValue = {
  profile: UserProfile;
  isLoading: boolean;
  saveProfile: (input: SaveProfileInput) => Promise<void>;
  resetProfile: () => Promise<void>;
};

const DEFAULT_PROFILE: UserProfile = {
  age: '',
  activityLevel: null,
  sleepQuality: null,
  triggers: [],
  symptoms: [],
  completed: false,
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserProfile>;
          setProfile({
            age: typeof parsed.age === 'string' ? parsed.age : '',
            activityLevel:
              parsed.activityLevel === 'low' ||
              parsed.activityLevel === 'medium' ||
              parsed.activityLevel === 'high'
                ? parsed.activityLevel
                : null,
            sleepQuality:
              parsed.sleepQuality === 'poor' ||
              parsed.sleepQuality === 'average' ||
              parsed.sleepQuality === 'good'
                ? parsed.sleepQuality
                : null,
            triggers: Array.isArray(parsed.triggers)
              ? parsed.triggers.filter((item): item is string => typeof item === 'string')
              : [],
            symptoms: Array.isArray(parsed.symptoms)
              ? parsed.symptoms.filter((item): item is string => typeof item === 'string')
              : [],
            completed: Boolean(parsed.completed),
          });
        }
      } catch (error) {
        console.warn('Failed to restore profile', error);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreProfile();
  }, []);

  const saveProfile = async (input: SaveProfileInput) => {
    const next: UserProfile = {
      age: input.age,
      activityLevel: input.activityLevel,
      sleepQuality: input.sleepQuality,
      triggers: input.triggers,
      symptoms: input.symptoms,
      completed: true,
    };

    setProfile(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('Failed to persist profile', error);
    }
  };

  const resetProfile = async () => {
    setProfile(DEFAULT_PROFILE);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear profile', error);
    }
  };

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isLoading,
      saveProfile,
      resetProfile,
    }),
    [profile, isLoading],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }

  return context;
};
