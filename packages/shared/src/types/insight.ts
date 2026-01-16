/**
 * User insights and patterns
 */
export interface Insights {
  score: DecisionScore;
  patterns: Patterns;
  summary: InsightSummary | null;
  recommendations: Recommendation[];
  lastUpdated: string;
}

/**
 * Decision score (0-100)
 */
export interface DecisionScore {
  current: number;
  trend: number; // Change this month (can be negative)
  components: {
    outcomeRate: number;
    processQuality: number;
    followThrough: number;
  };
}

/**
 * Pattern analysis results
 */
export interface Patterns {
  timing: TimingPattern | null;
  emotional: EmotionalPattern | null;
  categories: CategoryPattern[];
  velocity: VelocityPattern | null;
}

/**
 * Timing pattern - when decisions are made and outcomes
 */
export interface TimingPattern {
  bestHours: number[]; // Array of hours (0-23) with best outcomes
  worstHours: number[]; // Array of hours with worst outcomes
  lateNightDecisions: {
    count: number;
    positiveRate: number;
  };
  weekdayBreakdown: Array<{
    day: number; // 0=Sunday
    count: number;
    positiveRate: number;
  }>;
}

/**
 * Emotional pattern - how emotions correlate with outcomes
 */
export interface EmotionalPattern {
  emotions: Array<{
    emotion: string;
    count: number;
    positiveRate: number;
    averageConfidence: number;
  }>;
  bestEmotions: string[];
  worstEmotions: string[];
}

/**
 * Category performance pattern
 */
export interface CategoryPattern {
  categoryId: string;
  categoryName: string;
  decisionCount: number;
  positiveRate: number;
  averageDeliberation: number; // Days
  topEmotions: string[];
}

/**
 * Decision velocity pattern
 */
export interface VelocityPattern {
  averageDeliberationDays: number;
  optimalWindow: {
    minDays: number;
    maxDays: number;
    positiveRate: number;
  };
  quickDecisions: {
    count: number;
    positiveRate: number;
  };
  slowDecisions: {
    count: number;
    positiveRate: number;
  };
}

/**
 * Summary insight
 */
export interface InsightSummary {
  totalDecisions: number;
  reviewedDecisions: number;
  overallPositiveRate: number;
  topPattern: string; // Natural language description
  improvement: string; // What improved this month
  focus: string; // What to focus on
}

/**
 * Actionable recommendation
 */
export interface Recommendation {
  id: string;
  type: 'timing' | 'emotion' | 'category' | 'general';
  title: string;
  description: string;
  confidence: number; // 0-1
  basedOn: string; // Data point it's based on
}
