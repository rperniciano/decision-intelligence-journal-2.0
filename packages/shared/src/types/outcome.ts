/**
 * Outcome result type
 */
export type OutcomeResult = 'better' | 'as_expected' | 'worse';

/**
 * Outcome record for a decision
 */
export interface Outcome {
  id: string;
  decisionId: string;
  result: OutcomeResult;
  satisfaction: number | null; // 1-5 stars
  reflectionAudioUrl: string | null;
  reflectionTranscript: string | null;
  learned: string | null;
  scheduledFor: string | null;
  recordedAt: string;
  checkInNumber: number;
  createdAt: string;
}

/**
 * Outcome reminder
 */
export interface OutcomeReminder {
  id: string;
  decisionId: string;
  userId: string;
  remindAt: string;
  status: 'pending' | 'sent' | 'completed' | 'skipped';
  createdAt: string;
}

/**
 * Get outcome result display label
 */
export function getOutcomeLabel(result: OutcomeResult): string {
  switch (result) {
    case 'better':
      return 'Better than expected';
    case 'as_expected':
      return 'As expected';
    case 'worse':
      return 'Worse than expected';
  }
}

/**
 * Get outcome result emoji
 */
export function getOutcomeEmoji(result: OutcomeResult): string {
  switch (result) {
    case 'better':
      return '🎉';
    case 'as_expected':
      return '👍';
    case 'worse':
      return '😔';
  }
}
