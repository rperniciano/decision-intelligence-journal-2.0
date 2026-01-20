import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
config({ path: path.resolve(__dirname, '../../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check .env file.');
}

// Service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface EmotionalPattern {
  emotion: string;
  better: number;
  worse: number;
  as_expected: number;
  total: number;
  successRate: number;
}

export interface CategoryPattern {
  category: string;
  count: number;
  withOutcomes: number;
  positiveRate: number;
}

export interface PositionBiasPattern {
  position: number;
  chosenCount: number;
  totalCount: number;
  percentage: number;
}

export interface ConfidencePattern {
  lowConfidence: { count: number; positiveRate: number };
  mediumConfidence: { count: number; positiveRate: number };
  highConfidence: { count: number; positiveRate: number };
  correlation: string; // "positive", "negative", "neutral", "none"
}

// Feature #90: Timing patterns - best/worst hours for decisions
export interface TimingPattern {
  bestHours: number[];
  worstHours: number[];
  lateNightDecisions: {
    count: number;
    positiveRate: number;
  };
  weekdayBreakdown: Array<{
    day: number;
    count: number;
    positiveRate: number;
  }>;
}

// Feature #218: Gamification - Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

// Feature #218: Gamification - Streak tracking
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastRecordDate: string | null;
}

// Feature #218: Gamification - User level
export interface LevelData {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
}

export interface InsightsData {
  totalDecisions: number;
  decisionsWithOutcomes: number;
  positiveOutcomes: number;
  negativeOutcomes: number;
  neutralOutcomes: number;
  emotionalPatterns: Record<string, { better: number; worse: number; as_expected: number }>;
  categoryDistribution: Record<string, number>;
  decisionScore: number;
  scoreTrend: number;
  bestEmotionalState: EmotionalPattern | null;
  topCategories: CategoryPattern[];
  positionBias: PositionBiasPattern | null;
  timingPattern: TimingPattern | null; // Feature #90
  confidencePattern: ConfidencePattern | null; // Feature #210: Confidence vs outcome correlation
  // Feature #218: Gamification elements
  achievements: Achievement[];
  streakData: StreakData;
  levelData: LevelData;
}

export class InsightsService {
  /**
   * Calculate insights for a user based on their decisions
   */
  static async getInsights(userId: string): Promise<InsightsData> {
    // Fetch all decisions for the user (not deleted) with their options, pros_cons, and category
    // Use explicit relationship name to avoid ambiguity (decisions has two relationships to options table)
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select(`
        *,
        options!options_decision_id_fkey (
          id,
          display_order,
          pros_cons (id)
        ),
        category:categories(id, name)
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching decisions for insights:', error);
      throw error;
    }

    const allDecisions = decisions || [];

    // Calculate basic stats
    const totalDecisions = allDecisions.length;
    const decisionsWithOutcomes = allDecisions.filter(d => d.outcome);
    const positiveOutcomes = decisionsWithOutcomes.filter(d => d.outcome === 'better').length;
    const negativeOutcomes = decisionsWithOutcomes.filter(d => d.outcome === 'worse').length;
    const neutralOutcomes = decisionsWithOutcomes.filter(d => d.outcome === 'as_expected').length;

    // Calculate emotional patterns
    const emotionalPatterns: Record<string, { better: number; worse: number; as_expected: number }> = {};
    decisionsWithOutcomes.forEach(d => {
      const emotion = d.emotional_state || 'unknown';
      if (!emotionalPatterns[emotion]) {
        emotionalPatterns[emotion] = { better: 0, worse: 0, as_expected: 0 };
      }
      if (d.outcome === 'better') emotionalPatterns[emotion].better++;
      else if (d.outcome === 'worse') emotionalPatterns[emotion].worse++;
      else if (d.outcome === 'as_expected') emotionalPatterns[emotion].as_expected++;
    });

    // Calculate category distribution
    const categoryDistribution: Record<string, number> = {};
    allDecisions.forEach(d => {
      const category = d.category?.name || 'Uncategorized';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    // Feature #215: Calculate Decision Score based on outcome rate, process quality, and follow-through
    // Score is 0-100, composed of:
    // - Outcome Rate (40 points): Positive outcome percentage
    // - Process Quality (30 points): Based on thoroughness (options, pros/cons)
    // - Follow-through (30 points): Outcome recording rate

    let outcomeRateScore = 0;
    let processQualityScore = 0;
    let followThroughScore = 0;

    // 1. Outcome Rate Score (40 points): Based on positive outcome percentage
    if (decisionsWithOutcomes.length > 0) {
      const positiveRate = positiveOutcomes / decisionsWithOutcomes.length;
      // 40 points max: 100% positive outcomes = 40 points, 0% = 0 points
      // Use a curve that rewards high performance: positiveRate^0.8 * 40
      outcomeRateScore = Math.pow(positiveRate, 0.8) * 40;
    }

    // 2. Process Quality Score (30 points): Based on thoroughness
    // Measure by average number of options and pros/cons per decision
    if (totalDecisions > 0) {
      let totalOptions = 0;
      let totalProsCons = 0;

      // Count options and pros_cons from the nested query result
      allDecisions.forEach((decision: any) => {
        const options = decision.options || [];
        totalOptions += options.length;

        options.forEach((option: any) => {
          const prosCons = option.pros_cons || [];
          totalProsCons += prosCons.length;
        });
      });

      // Calculate averages
      const avgOptions = totalOptions / totalDecisions;
      const avgProsCons = totalOptions > 0 ? totalProsCons / totalOptions : 0;

      // Process quality scoring:
      // - Good: 2+ options, 2+ pros/cons per option (30 points)
      // - Average: 2 options, 1 pro/con per option (20 points)
      // - Basic: 1-2 options, minimal pros/cons (10 points)
      const optionsScore = Math.min(15, avgOptions * 5); // Max 15 points for options
      const prosConsScore = Math.min(15, avgProsCons * 5); // Max 15 points for pros/cons
      processQualityScore = optionsScore + prosConsScore;
    }

    // 3. Follow-through Score (30 points): Based on outcome recording rate
    // This measures how well users complete the decision lifecycle
    if (totalDecisions > 0) {
      const followThroughRate = decisionsWithOutcomes.length / totalDecisions;
      // 30 points max: 100% follow-through = 30 points
      // Use a gentle curve to encourage consistency
      followThroughScore = followThroughRate * 30;
    }

    // Combine scores for final Decision Score (0-100)
    const decisionScore = Math.min(100, Math.round(
      outcomeRateScore + processQualityScore + followThroughScore
    ));

    // Calculate score trend (compare this month vs last month)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthDecisions = allDecisions.filter(d => new Date(d.created_at) >= thisMonthStart);
    const lastMonthDecisions = allDecisions.filter(d => {
      const date = new Date(d.created_at);
      return date >= lastMonthStart && date < thisMonthStart;
    });

    // Calculate trend by comparing the change in score components
    // This is a simplified trend calculation
    const thisMonthDecisionsCount = thisMonthDecisions.length;
    const lastMonthDecisionsCount = lastMonthDecisions.length;

    // Trend is based on decision volume improvement (simplified)
    // More accurate would be to calculate full score for each month, but that's expensive
    let scoreTrend = 0;
    if (lastMonthDecisionsCount > 0) {
      const growthRate = (thisMonthDecisionsCount - lastMonthDecisionsCount) / lastMonthDecisionsCount;
      scoreTrend = Math.round(growthRate * 10); // Scale to reasonable range
    } else if (thisMonthDecisionsCount > 0) {
      scoreTrend = 5; // Positive trend when starting from zero
    }

    // Clamp trend to reasonable bounds
    scoreTrend = Math.max(-20, Math.min(20, scoreTrend));

    // Find best emotional state
    let bestEmotionalState: EmotionalPattern | null = null;
    const emotionEntries = Object.entries(emotionalPatterns);
    if (emotionEntries.length > 0) {
      const emotionStats = emotionEntries.map(([emotion, outcomes]) => {
        const total = outcomes.better + outcomes.worse + outcomes.as_expected;
        const successRate = total > 0 ? outcomes.better / total : 0;
        return { emotion, ...outcomes, total, successRate };
      });

      // Only consider emotions with at least 2 decisions
      const validEmotions = emotionStats.filter(e => e.total >= 2);
      if (validEmotions.length > 0) {
        bestEmotionalState = validEmotions.reduce((best, current) =>
          current.successRate > best.successRate ? current : best
        );
      }
    }

    // Calculate top categories with outcomes
    const categoryStats: CategoryPattern[] = Object.entries(categoryDistribution).map(([category, count]) => {
      const categoryDecisions = allDecisions.filter(d => (d.category?.name || 'Uncategorized') === category);
      const withOutcomes = categoryDecisions.filter(d => d.outcome).length;
      const positives = categoryDecisions.filter(d => d.outcome === 'better').length;
      const positiveRate = withOutcomes > 0 ? positives / withOutcomes : 0;
      return { category, count, withOutcomes, positiveRate };
    });

    const topCategories = categoryStats.sort((a, b) => b.count - a.count).slice(0, 5);

    // Calculate option position bias (primacy bias detection)
    let positionBias: PositionBiasPattern | null = null;

    // Get decided decisions with options that have a chosen option
    const decidedDecisionsWithOptions = allDecisions.filter(d =>
      d.chosen_option_id && d.options && d.options.length > 1
    );

    if (decidedDecisionsWithOptions.length >= 3) {
      // Track position statistics
      const positionStats: Map<number, { chosen: number; total: number }> = new Map();

      decidedDecisionsWithOptions.forEach(decision => {
        const options = decision.options || [];

        // Sort options by display_order to get correct positions
        const sortedOptions = options.sort((a: any, b: any) =>
          (a.display_order || 0) - (b.display_order || 0)
        );

        // Track each position
        sortedOptions.forEach((option: any, index: number) => {
          const position = index + 1; // 1-based position
          if (!positionStats.has(position)) {
            positionStats.set(position, { chosen: 0, total: 0 });
          }
          const stats = positionStats.get(position)!;
          stats.total++;

          // Check if this option was chosen
          if (decision.chosen_option_id === option.id) {
            stats.chosen++;
          }
        });
      });

      // Find the position with the highest selection rate (potential bias)
      let highestBias: PositionBiasPattern | null = null;

      positionStats.forEach((stats, position) => {
        const percentage = stats.total > 0 ? (stats.chosen / stats.total) * 100 : 0;

        // Only consider significant bias: at least 30% selection rate and at least 3 instances
        if (stats.chosen >= 3 && percentage >= 30) {
          if (!highestBias || percentage > highestBias.percentage) {
            highestBias = {
              position,
              chosenCount: stats.chosen,
              totalCount: stats.total,
              percentage: Math.round(percentage),
            };
          }
        }
      });

      positionBias = highestBias;
    }

    // Feature #90: Calculate timing patterns (best/worst hours for decisions)
    let timingPattern: TimingPattern | null = null;

    if (decisionsWithOutcomes.length >= 5) {
      // Hour-by-hour statistics (0-23)
      const hourlyStats: Map<number, { positive: number; total: number }> = new Map();
      for (let i = 0; i < 24; i++) {
        hourlyStats.set(i, { positive: 0, total: 0 });
      }

      // Weekday statistics (0=Sunday, 6=Saturday)
      const weekdayStats: Map<number, { positive: number; total: number }> = new Map();
      for (let i = 0; i < 7; i++) {
        weekdayStats.set(i, { positive: 0, total: 0 });
      }

      // Late-night decisions (10pm - 6am)
      let lateNightCount = 0;
      let lateNightPositive = 0;

      decisionsWithOutcomes.forEach(d => {
        const createdAt = new Date(d.created_at);
        const hour = createdAt.getHours();
        const day = createdAt.getDay();

        // Update hourly stats
        const hourStats = hourlyStats.get(hour)!;
        hourStats.total++;
        if (d.outcome === 'better') {
          hourStats.positive++;
        }

        // Update weekday stats
        const dayStats = weekdayStats.get(day)!;
        dayStats.total++;
        if (d.outcome === 'better') {
          dayStats.positive++;
        }

        // Check if late night (10pm-6am, i.e., hours 22-23 and 0-5)
        if (hour >= 22 || hour < 6) {
          lateNightCount++;
          if (d.outcome === 'better') {
            lateNightPositive++;
          }
        }
      });

      // Calculate positive rate for each hour
      const hourlyRates: Array<{ hour: number; rate: number; count: number }> = [];
      hourlyStats.forEach((stats, hour) => {
        if (stats.total >= 2) { // Only consider hours with at least 2 decisions
          const rate = stats.positive / stats.total;
          hourlyRates.push({ hour, rate, count: stats.total });
        }
      });

      // Sort by positive rate
      hourlyRates.sort((a, b) => b.rate - a.rate);

      // Best hours (top 3 by positive rate)
      const bestHours = hourlyRates.slice(0, 3).map(h => h.hour);

      // Worst hours (bottom 3 by positive rate)
      const worstHours = hourlyRates.slice(-3).reverse().map(h => h.hour);

      // Late night positive rate
      const lateNightPositiveRate = lateNightCount > 0 ? lateNightPositive / lateNightCount : 0;

      // Weekday breakdown
      const weekdayBreakdown = Array.from(weekdayStats.entries())
        .map(([day, stats]) => ({
          day,
          count: stats.total,
          positiveRate: stats.total > 0 ? stats.positive / stats.total : 0,
        }))
        .filter(wd => wd.count > 0) // Only include days with decisions
        .sort((a, b) => a.day - b.day); // Sort by day

      timingPattern = {
        bestHours,
        worstHours,
        lateNightDecisions: {
          count: lateNightCount,
          positiveRate: lateNightPositiveRate,
        },
        weekdayBreakdown,
      };
    }

    // Feature #210: Calculate confidence vs outcome correlation
    let confidencePattern: ConfidencePattern | null = null;

    // Filter decisions with both confidence level and outcome
    const decisionsWithConfidenceAndOutcome = decisionsWithOutcomes.filter(d =>
      d.confidence_level !== null && d.confidence_level !== undefined
    );

    if (decisionsWithConfidenceAndOutcome.length >= 5) {
      // Categorize by confidence levels: low (1-2), medium (3), high (4-5)
      let lowCount = 0, lowPositive = 0;
      let mediumCount = 0, mediumPositive = 0;
      let highCount = 0, highPositive = 0;

      decisionsWithConfidenceAndOutcome.forEach(d => {
        const confidence = d.confidence_level!;
        const isPositive = d.outcome === 'better';

        if (confidence <= 2) {
          lowCount++;
          if (isPositive) lowPositive++;
        } else if (confidence === 3) {
          mediumCount++;
          if (isPositive) mediumPositive++;
        } else { // confidence >= 4
          highCount++;
          if (isPositive) highPositive++;
        }
      });

      const lowPositiveRate = lowCount > 0 ? lowPositive / lowCount : 0;
      const mediumPositiveRate = mediumCount > 0 ? mediumPositive / mediumCount : 0;
      const highPositiveRate = highCount > 0 ? highPositive / highCount : 0;

      // Determine correlation type
      // Positive correlation: higher confidence → higher success rate
      // Negative correlation: higher confidence → lower success rate (overconfidence)
      // Neutral: rates are similar
      let correlation: string;

      const rateDiff = highPositiveRate - lowPositiveRate;
      const threshold = 0.15; // 15% difference threshold

      if (Math.abs(rateDiff) < threshold) {
        correlation = 'neutral'; // No significant correlation
      } else if (rateDiff > 0) {
        correlation = 'positive'; // Higher confidence correlates with better outcomes
      } else {
        correlation = 'negative'; // Higher confidence correlates with worse outcomes (overconfidence bias)
      }

      confidencePattern = {
        lowConfidence: {
          count: lowCount,
          positiveRate: lowPositiveRate,
        },
        mediumConfidence: {
          count: mediumCount,
          positiveRate: mediumPositiveRate,
        },
        highConfidence: {
          count: highCount,
          positiveRate: highPositiveRate,
        },
        correlation,
      };
    }

    return {
      totalDecisions,
      decisionsWithOutcomes: decisionsWithOutcomes.length,
      positiveOutcomes,
      negativeOutcomes,
      neutralOutcomes,
      emotionalPatterns,
      categoryDistribution,
      decisionScore,
      scoreTrend,
      bestEmotionalState,
      topCategories,
      positionBias,
      timingPattern, // Feature #90
      confidencePattern, // Feature #210: Confidence vs outcome correlation
    };
  }
}
