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
}

export class InsightsService {
  /**
   * Calculate insights for a user based on their decisions
   */
  static async getInsights(userId: string): Promise<InsightsData> {
    // Fetch all decisions for the user (not deleted) with their options
    // Use explicit relationship name to avoid ambiguity (decisions has two relationships to options table)
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select(`
        *,
        options!options_decision_id_fkey (id, display_order)
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
      const category = d.category || 'Uncategorized';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    // Calculate decision score (simple formula: total decisions * 2, max 100)
    const decisionScore = Math.min(100, totalDecisions * 2);

    // Calculate score trend (compare this month vs last month)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthDecisions = allDecisions.filter(d => new Date(d.created_at) >= thisMonthStart);
    const lastMonthDecisions = allDecisions.filter(d => {
      const date = new Date(d.created_at);
      return date >= lastMonthStart && date < thisMonthStart;
    });

    const thisMonthScore = Math.min(100, thisMonthDecisions.length * 10);
    const lastMonthScore = Math.min(100, lastMonthDecisions.length * 10);
    const scoreTrend = thisMonthScore - lastMonthScore;

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
      const categoryDecisions = allDecisions.filter(d => (d.category || 'Uncategorized') === category);
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
        if (stats.count >= 2) { // Only consider hours with at least 2 decisions
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
    };
  }
}
