import { z } from 'zod';

/**
 * Schema for updating user profile
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

/**
 * Schema for notification settings
 */
export const NotificationSettingsSchema = z.object({
  outcomeReminders: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
});

/**
 * Schema for default settings
 */
export const DefaultSettingsSchema = z.object({
  reminderDays: z.number().int().min(1).max(365).optional(),
  inputPreference: z.enum(['voice', 'text', 'both']).optional(),
  autoCategorize: z.boolean().optional(),
});

/**
 * Schema for appearance settings
 */
export const AppearanceSettingsSchema = z.object({
  theme: z.enum(['dark', 'darker', 'oled', 'midnight']).optional(),
  reduceMotion: z.boolean().optional(),
});

/**
 * Schema for privacy settings
 */
export const PrivacySettingsSchema = z.object({
  shareAnonymousAnalytics: z.boolean().optional(),
});

/**
 * Schema for updating all user settings
 */
export const UpdateSettingsSchema = z.object({
  notifications: NotificationSettingsSchema.optional(),
  defaults: DefaultSettingsSchema.optional(),
  appearance: AppearanceSettingsSchema.optional(),
  privacy: PrivacySettingsSchema.optional(),
});

/**
 * Schema for account deletion
 */
export const DeleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmation: z.literal('DELETE'),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
