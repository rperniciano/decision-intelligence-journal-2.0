/**
 * Decision status throughout its lifecycle
 */
export type DecisionStatus = 'draft' | 'deliberating' | 'decided' | 'abandoned' | 'reviewed';

/**
 * Emotional state when making a decision
 */
export type EmotionalState =
  | 'calm'
  | 'confident'
  | 'anxious'
  | 'excited'
  | 'uncertain'
  | 'stressed'
  | 'neutral'
  | 'hopeful'
  | 'frustrated';

/**
 * Processing status for voice recordings
 */
export type ProcessingStatus =
  | 'uploaded'
  | 'transcribing'
  | 'extracting'
  | 'completed'
  | 'failed'
  | 'retrying';

/**
 * A decision option
 */
export interface DecisionOption {
  id: string;
  decisionId: string;
  name: string;
  position: number;
  isChosen: boolean;
  pros: ProCon[];
  cons: ProCon[];
  createdAt: string;
}

/**
 * A pro or con for an option
 */
export interface ProCon {
  id: string;
  optionId: string;
  type: 'pro' | 'con';
  content: string;
  position: number;
  aiGenerated: boolean;
  createdAt: string;
}

/**
 * Core decision entity
 */
export interface Decision {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  transcript: string | null;
  status: DecisionStatus;
  emotionalState: EmotionalState | null;
  confidenceLevel: number | null; // 1-5
  chosenOptionId: string | null;
  recordedAt: string | null;
  decideByDate: string | null;
  decidedAt: string | null;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  aiExtraction: AIExtraction | null;
  aiConfidence: number | null;
  abandonReason: string | null;
  abandonNote: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Relations (optional, populated when needed)
  options?: DecisionOption[];
  category?: Category;
  outcomes?: Outcome[];
}

/**
 * AI extraction result
 */
export interface AIExtraction {
  title: string;
  options: Array<{
    name: string;
    pros: string[];
    cons: string[];
  }>;
  emotionalState: EmotionalState;
  suggestedCategory: string | null;
  confidence: number;
}

/**
 * Processing job for voice pipeline
 */
export interface ProcessingJob {
  id: string;
  userId: string;
  status: ProcessingStatus;
  progress: number; // 0-1
  audioUrl: string;
  audioDurationSeconds: number | null;
  transcript: string | null;
  extraction: AIExtraction | null;
  decisionId: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  retryCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// Import for Category and Outcome types
import type { Category } from './category';
import type { Outcome } from './outcome';
