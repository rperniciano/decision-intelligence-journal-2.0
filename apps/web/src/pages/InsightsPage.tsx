import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { SkipLink } from '../components/SkipLink';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Pattern card component
function PatternCard({
  title,
  description,
  value,
  trend,
  icon,
  index,
  patternId,
}: {
  title: string;
  description: string;
  value: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string };
  icon: React.ReactNode;
  index: number;
  patternId: string;
}) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-text-secondary',
  };

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
  };

  return (
    <Link to={`/insights/patterns/${patternId}`}>
      <motion.div
        className="glass p-5 rounded-2xl rim-light min-w-[280px] max-w-[320px] flex-shrink-0 cursor-pointer hover:scale-[1.02] transition-transform"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColors[trend.direction]}`}>
            {trendIcons[trend.direction]}
            <span className="text-sm font-medium">{trend.value}</span>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-text-secondary text-sm mb-3">{description}</p>
      <div className="text-2xl font-bold text-gradient">{value}</div>
      </motion.div>
    </Link>
  );
}

// Decision Score display
function DecisionScore({ score, trend }: { score: number; trend: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'from-emerald-400 to-emerald-600';
    if (score >= 40) return 'from-amber-400 to-amber-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <motion.div
      className="glass p-6 rounded-2xl rim-light text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg font-medium text-text-secondary mb-4">Decision Score</h2>
      <div className="relative w-32 h-32 mx-auto mb-4">
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.83} 283`}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`text-accent`} stopColor="currentColor" />
              <stop offset="100%" className={`text-accent-700`} stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
            {score}
          </span>
        </div>
      </div>
      <div className={`flex items-center justify-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        <span className="text-sm font-medium">{trend >= 0 ? '+' : ''}{trend} this month</span>
      </div>
    </motion.div>
  );
}

// Feature #218: Level display component
function LevelDisplay({ levelData }: { levelData: LevelData }) {
  const percentage = (levelData.currentXP / levelData.xpToNextLevel) * 100;

  return (
    <motion.div
      className="glass p-5 rounded-2xl rim-light"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-700 flex items-center justify-center text-white font-bold text-lg">
            {levelData.level}
          </div>
          <div>
            <h3 className="font-semibold text-lg">Level {levelData.level}</h3>
            <p className="text-text-secondary text-sm">Total XP: {levelData.totalXP}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-secondary">Next Level</p>
          <p className="font-medium text-accent">{levelData.xpToNextLevel} XP</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent-700 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* XP Progress Text */}
      <div className="flex justify-between mt-2 text-xs text-text-secondary">
        <span>{levelData.currentXP} XP</span>
        <span>{levelData.xpToNextLevel} XP to Level {levelData.level + 1}</span>
      </div>
    </motion.div>
  );
}

// Feature #218: Streak display component
function StreakDisplay({ streakData }: { streakData: StreakData }) {
  return (
    <motion.div
      className="glass p-5 rounded-2xl rim-light"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{streakData.currentStreak} Day Streak</h3>
            <p className="text-text-secondary text-sm">Keep it going!</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-secondary">Best</p>
          <p className="font-medium text-orange-400">{streakData.longestStreak} days</p>
        </div>
      </div>

      {/* Streak Visual Indicator */}
      <div className="flex gap-1 mt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < Math.min(streakData.currentStreak, 7)
                ? 'bg-gradient-to-r from-orange-500 to-red-600'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      {streakData.currentStreak === 0 && (
        <p className="text-xs text-text-secondary mt-2">Record a decision today to start your streak!</p>
      )}
    </motion.div>
  );
}

// Feature #218: Achievement card component
function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  return (
    <motion.div
      className={`glass p-4 rounded-xl rim-light ${achievement.unlocked ? 'opacity-100' : 'opacity-50'}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: achievement.unlocked ? 1 : 0.5, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={achievement.unlocked ? { scale: 1.02 } : {}}
    >
      <div className="flex items-start gap-3">
        <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${achievement.unlocked ? 'text-white' : 'text-text-secondary'}`}>
              {achievement.name}
            </h4>
            {!achievement.unlocked && (
              <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-text-secondary">Locked</span>
            )}
          </div>
          <p className="text-xs text-text-secondary mb-2">{achievement.description}</p>

          {/* Progress bar for achievements with progress */}
          {achievement.maxProgress && achievement.progress !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>Progress</span>
                <span>{achievement.progress}/{achievement.maxProgress}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                />
              </div>
            </div>
          )}

          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-accent mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Empty state when no data
function EmptyState() {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
        <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">No insights yet</h3>
      <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
        Record a few decisions to start seeing your patterns. We need at least 3 decisions with outcomes to generate meaningful insights.
      </p>
      <Link to="/record">
        <motion.button
          className="px-6 py-2.5 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Record a Decision
        </motion.button>
      </Link>
    </motion.div>
  );
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastRecordDate: string | null;
}

interface LevelData {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
}

interface InsightsData {
  totalDecisions: number;
  decisionsWithOutcomes: number;
  positiveOutcomes: number;
  negativeOutcomes: number;
  neutralOutcomes: number;
  emotionalPatterns: Record<string, { better: number; worse: number; as_expected: number }>;
  categoryDistribution: Record<string, number>;
  topCategories: Array<{ // Feature #207: Category performance data
    category: string;
    count: number;
    withOutcomes: number;
    positiveRate: number;
  }>;
  decisionScore: number;
  positionBias: {
    position: number;
    chosenCount: number;
    totalCount: number;
    percentage: number;
  } | null;
  timingPattern: { // Feature #90
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
  } | null;
  confidencePattern: { // Feature #210
    lowConfidence: { count: number; positiveRate: number };
    mediumConfidence: { count: number; positiveRate: number };
    highConfidence: { count: number; positiveRate: number };
    correlation: string;
  } | null;
  // Feature #218: Gamification elements
  achievements: Achievement[];
  streakData: StreakData;
  levelData: LevelData;
}

export function InsightsPage() {
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Feature #268: Add AbortController to prevent race conditions during rapid navigation
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function fetchInsights() {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) return;

        // Fetch insights from API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/insights`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal, // Feature #268: Pass abort signal
        });

        if (!response.ok) throw new Error('Failed to fetch insights');

        const insights = await response.json();

        setInsightsData({
          totalDecisions: insights.totalDecisions,
          decisionsWithOutcomes: insights.decisionsWithOutcomes,
          positiveOutcomes: insights.positiveOutcomes,
          negativeOutcomes: insights.negativeOutcomes,
          neutralOutcomes: insights.neutralOutcomes,
          emotionalPatterns: insights.emotionalPatterns,
          categoryDistribution: insights.categoryDistribution,
          topCategories: insights.topCategories || [], // Feature #207: Category performance data
          decisionScore: insights.decisionScore,
          positionBias: insights.positionBias,
          timingPattern: insights.timingPattern || null, // Feature #90
          confidencePattern: insights.confidencePattern || null, // Feature #210
          // Feature #218: Gamification elements
          achievements: insights.achievements || [],
          streakData: insights.streakData || { currentStreak: 0, longestStreak: 0, lastRecordDate: null },
          levelData: insights.levelData || { level: 1, currentXP: 0, xpToNextLevel: 10, totalXP: 0 },
        });
      } catch (error: any) {
        // Feature #268: Silently ignore abort errors
        if (error.name !== 'AbortError') {
          console.error('Error fetching insights:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();

    // Feature #268: Cleanup function - abort fetch on unmount
    return () => {
      abortController.abort();
    };
  }, []);

  const hasData = insightsData && insightsData.decisionsWithOutcomes >= 3;
  const decisionScore = insightsData?.decisionScore || 0;
  const scoreTrend = 0; // Will be calculated from historical data in future

  // Generate patterns from real data
  const bestEmotionalState = insightsData ? (() => {
    const emotions = Object.entries(insightsData.emotionalPatterns);
    if (emotions.length === 0) return 'Not enough data';

    const bestEmotion = emotions.reduce((best, [emotion, outcomes]) => {
      const successRate = outcomes.better / (outcomes.better + outcomes.worse + outcomes.as_expected || 1);
      const bestRate = best.rate;
      return successRate > bestRate ? { emotion, rate: successRate } : best;
    }, { emotion: 'unknown', rate: 0 });

    return bestEmotion.emotion !== 'unknown' ? `${bestEmotion.emotion} (${Math.round(bestEmotion.rate * 100)}% success)` : 'Not enough data';
  })() : 'Not enough data';

  const outcomeRate = insightsData && insightsData.decisionsWithOutcomes > 0
    ? `${Math.round((insightsData.positiveOutcomes / insightsData.decisionsWithOutcomes) * 100)}% positive`
    : 'Not enough data';

  // Feature #207: Category Performance - find category with most decisions AND show success rate
  const categoryPerformance = insightsData ? (() => {
    const topCategories = insightsData.topCategories || [];
    if (topCategories.length === 0) return 'Not enough data';

    const topCategory = topCategories[0];
    const successRate = Math.round(topCategory.positiveRate * 100);
    return `${topCategory.category}: ${topCategory.count} decisions (${successRate}% success)`;
  })() : 'Not enough data';

  // Position Bias (Primacy Bias) - detect if user tends to choose first option
  const positionBiasPattern = insightsData?.positionBias
    ? `Position #${insightsData.positionBias.position}: ${insightsData.positionBias.percentage}%`
    : 'No bias detected';

  const hasPositionBias = insightsData?.positionBias !== null;

  // Feature #90: Calculate timing bias pattern
  const timingBiasPattern = insightsData?.timingPattern ? (() => {
    const tp = insightsData.timingPattern;
    if (tp.lateNightDecisions.count > 0) {
      return `Late night: ${Math.round(tp.lateNightDecisions.positiveRate * 100)}% positive`;
    }
    if (tp.bestHours.length > 0) {
      const hour = tp.bestHours[0];
      const timeStr = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      return `Best: ${timeStr}`;
    }
    return 'Not enough data';
  })() : 'Not enough data';

  const hasTimingPattern = insightsData?.timingPattern !== null;

  // Feature #210: Calculate confidence vs outcome correlation pattern
  const hasConfidencePattern = insightsData?.confidencePattern !== null;
  const confidencePattern = insightsData?.confidencePattern ? (() => {
    const cp = insightsData.confidencePattern!;

    // Format the display based on correlation type
    if (cp.correlation === 'positive') {
      return `High confidence: ${Math.round(cp.highConfidence.positiveRate * 100)}% success`;
    } else if (cp.correlation === 'negative') {
      return `Overconfidence detected`;
    } else if (cp.correlation === 'neutral') {
      return `No clear pattern`;
    } else {
      return 'Not enough data';
    }
  })() : 'Not enough data';

  const patterns = [
    {
      title: 'Outcome Rate',
      description: 'Your positive outcome percentage',
      value: outcomeRate,
      patternId: 'outcome-rate',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Emotional Impact',
      description: 'Your most successful mindset',
      value: bestEmotionalState,
      patternId: 'emotional-impact',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      ),
    },
    {
      title: 'Category Performance',
      description: 'Your most-used category',
      value: categoryPerformance,
      patternId: 'category-performance',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      title: 'Decision Count',
      description: 'Total decisions tracked',
      value: insightsData ? `${insightsData.totalDecisions} decisions` : 'Not enough data',
      patternId: 'decision-count',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
    // Feature #90: Timing Bias pattern card
    ...(hasTimingPattern ? [{
      title: 'Timing Bias',
      description: insightsData?.timingPattern?.lateNightDecisions.count && insightsData.timingPattern.lateNightDecisions.count > 0
        ? 'Your late-night decision performance'
        : 'Your best hours for decisions',
      value: timingBiasPattern,
      patternId: 'timing-bias',
      trend: insightsData?.timingPattern?.lateNightDecisions.positiveRate && insightsData.timingPattern.lateNightDecisions.positiveRate < 0.5
        ? { direction: 'down' as const, value: 'Avoid late night' }
        : insightsData?.timingPattern?.bestHours && insightsData.timingPattern.bestHours.length > 0
        ? { direction: 'up' as const, value: 'Best time' }
        : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    }] : []),
    ...(hasPositionBias ? [{
      title: 'Position Bias',
      description: hasPositionBias && insightsData?.positionBias?.position === 1
        ? 'You tend to choose the first option'
        : `Your most chosen option position`,
      value: positionBiasPattern,
      patternId: 'position-bias',
      trend: hasPositionBias && insightsData?.positionBias?.percentage && insightsData.positionBias.percentage >= 50
        ? { direction: 'up' as const, value: 'Primacy bias' }
        : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      ),
    }] : []),
    // Feature #210: Confidence vs outcome correlation pattern card
    ...(hasConfidencePattern ? [{
      title: 'Confidence Correlation',
      description: insightsData?.confidencePattern?.correlation === 'negative'
        ? 'Higher confidence leads to worse outcomes'
        : insightsData?.confidencePattern?.correlation === 'positive'
        ? 'Your confidence matches outcomes'
        : 'How confidence relates to outcomes',
      value: confidencePattern,
      patternId: 'confidence-correlation',
      trend: insightsData?.confidencePattern?.correlation === 'negative'
        ? { direction: 'down' as const, value: 'Overconfidence' }
        : insightsData?.confidencePattern?.correlation === 'positive'
        ? { direction: 'up' as const, value: 'Well-calibrated' }
        : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    }] : []),
  ];

  return (
    <div className="min-h-screen pb-20">
      <SkipLink />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <motion.h1
            className="text-2xl font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Insights
          </motion.h1>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6" tabIndex={-1}>
        {hasData ? (
          <>
            {/* Decision Score */}
            <section className="mb-8">
              <DecisionScore score={decisionScore} trend={scoreTrend} />
            </section>

            {/* Feature #218: Gamification - Level and Streak */}
            <section className="mb-8 grid grid-cols-2 gap-4">
              <LevelDisplay levelData={insightsData!.levelData} />
              <StreakDisplay streakData={insightsData!.streakData} />
            </section>

            {/* Feature #218: Gamification - Achievements */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Achievements</h2>
              <div className="grid grid-cols-1 gap-3">
                {insightsData!.achievements.map((achievement, index) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    index={index}
                  />
                ))}
              </div>
            </section>

            {/* Pattern Cards */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Your Patterns</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {patterns.map((pattern, index) => (
                  <PatternCard
                    key={pattern.title}
                    title={pattern.title}
                    description={pattern.description}
                    value={pattern.value}
                    icon={pattern.icon}
                    index={index}
                    patternId={pattern.patternId}
                  />
                ))}
              </div>
            </section>

            {/* This Month's Focus */}
            <section>
              <motion.div
                className="glass p-5 rounded-2xl rim-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg">This Month's Focus</h3>
                </div>
                <p className="text-text-secondary">
                  Record more decisions to unlock personalized recommendations. We'll analyze your patterns and suggest ways to improve your decision-making.
                </p>
              </motion.div>
            </section>
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default InsightsPage;
