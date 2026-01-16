/**
 * Application constants
 */

// Recording constraints
export const MIN_RECORDING_SECONDS = 2;
export const MAX_RECORDING_SECONDS = 300; // 5 minutes

// Validation limits
export const MAX_TITLE_LENGTH = 200;
export const MAX_OPTION_NAME_LENGTH = 200;
export const MAX_PRO_CON_LENGTH = 500;
export const MAX_CATEGORY_NAME_LENGTH = 50;
export const MAX_OPTIONS_PER_DECISION = 10;
export const MAX_PROS_CONS_PER_OPTION = 20;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Reminders
export const DEFAULT_REMINDER_DAYS = 14;
export const MAX_RETRIES_PER_REMINDER = 3;

// Processing
export const MAX_TRANSCRIPTION_RETRIES = 3;
export const TRANSCRIPTION_RETRY_DELAY_MS = 5000;

// Session
export const SESSION_EXPIRY_DAYS = 30;

// Rate limiting
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// Soft delete
export const SOFT_DELETE_RECOVERY_DAYS = 7;
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

// Decision score
export const MIN_DECISIONS_FOR_SCORE = 5;
export const INITIAL_DECISION_SCORE = 50;

// Colors
export const COLORS = {
  BG_DEEP: '#0a0a0f',
  BG_GRADIENT: '#1a1a2e',
  ACCENT: '#00d4aa',
  TEXT_PRIMARY: '#f0f0f5',
  TEXT_SECONDARY: '#9ca3af',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
} as const;

// Motion
export const MOTION = {
  SPRING: { mass: 1, damping: 15 },
  STAGGER_DELAY: 0.1,
  EASING: [0.25, 1, 0.5, 1] as [number, number, number, number],
} as const;
