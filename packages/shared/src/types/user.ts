/**
 * User profile
 */
export interface UserProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  settings: UserSettings;
  decisionScore: number;
  totalDecisions: number;
  positiveOutcomeRate: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User settings
 */
export interface UserSettings {
  notifications: NotificationSettings;
  defaults: DefaultSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
}

/**
 * Notification preferences
 */
export interface NotificationSettings {
  outcomeReminders: boolean;
  weeklyDigest: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  quietHoursStart: string | null; // "22:00"
  quietHoursEnd: string | null; // "08:00"
}

/**
 * Default values for new decisions
 */
export interface DefaultSettings {
  reminderDays: number; // Default days until reminder
  inputPreference: 'voice' | 'text' | 'both';
  autoCategorize: boolean;
}

/**
 * Appearance settings
 */
export interface AppearanceSettings {
  theme: 'dark' | 'darker' | 'oled' | 'midnight';
  reduceMotion: boolean;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  shareAnonymousAnalytics: boolean;
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    outcomeReminders: true,
    weeklyDigest: false,
    pushEnabled: true,
    emailEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  },
  defaults: {
    reminderDays: 14,
    inputPreference: 'voice',
    autoCategorize: true,
  },
  appearance: {
    theme: 'dark',
    reduceMotion: false,
  },
  privacy: {
    shareAnonymousAnalytics: false,
  },
};
