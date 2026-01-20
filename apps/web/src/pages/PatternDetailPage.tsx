import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { SkipLink } from '../components/SkipLink';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PatternDetailData {
  patternType: string;
  title: string;
  description: string;
  value: string;
  insights: string[];
  relatedDecisions: Array<{
    id: string;
    title: string;
    outcome: string;
    createdAt: string;
  }>;
  recommendations: string[];
}

// Pattern metadata
const PATTERN_METADATA: Record<string, {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = {
  'outcome-rate': {
    title: 'Outcome Rate',
    description: 'Your overall positive outcome percentage across all decisions',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-emerald-400 to-emerald-600',
  },
  'emotional-impact': {
    title: 'Emotional Impact',
    description: 'How your emotional state affects decision outcomes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
    color: 'from-purple-400 to-purple-600',
  },
  'category-performance': {
    title: 'Category Performance',
    description: 'Decision-making patterns by category',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    color: 'from-blue-400 to-blue-600',
  },
  'decision-count': {
    title: 'Decision Count',
    description: 'Total number of decisions tracked',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
    color: 'from-amber-400 to-amber-600',
  },
  'position-bias': {
    title: 'Position Bias',
    description: 'Tendency to favor certain option positions',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ),
    color: 'from-rose-400 to-rose-600',
  },
};

function PatternDetailPage() {
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();
  const [patternData, setPatternData] = useState<PatternDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert URL-safe pattern ID to metadata key
  const patternKey = patternId?.replace(/-/g, '') || '';
  const metadata = PATTERN_METADATA[patternKey] || PATTERN_METADATA['outcome-rate'];

  useEffect(() => {
    async function fetchPatternDetails() {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch insights data
        const response = await fetch(`${import.meta.env.VITE_API_URL}/insights`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch pattern details');

        const insights = await response.json();

        // Build pattern detail data based on pattern type
        const detailData: PatternDetailData = {
          patternType: patternId || 'unknown',
          title: metadata.title,
          description: metadata.description,
          value: '',
          insights: [],
          relatedDecisions: [],
          recommendations: [],
        };

        // Populate data based on pattern type
        switch (patternKey) {
          case 'outcomerate':
            const positiveRate = insights.decisionsWithOutcomes > 0
              ? Math.round((insights.positiveOutcomes / insights.decisionsWithOutcomes) * 100)
              : 0;
            detailData.value = `${positiveRate}% positive`;
            detailData.insights = [
              `Total decisions with outcomes: ${insights.decisionsWithOutcomes}`,
              `Positive outcomes: ${insights.positiveOutcomes}`,
              `Negative outcomes: ${insights.negativeOutcomes}`,
              `Neutral outcomes: ${insights.neutralOutcomes}`,
            ];
            detailData.recommendations = positiveRate >= 70
              ? [
                  'Your outcome rate is excellent! Keep up the good work.',
                  'Consider documenting what factors contribute to your success.',
                ]
              : positiveRate >= 40
              ? [
                  'Your outcome rate is moderate. Consider taking more time on important decisions.',
                  'Try to identify patterns in decisions that lead to positive outcomes.',
                ]
              : [
                  'Consider spending more time analyzing options before deciding.',
                  'Review past decisions to understand what could be improved.',
                  'Don\'t rush important decisions - sleep on them when possible.',
                ];
            break;

          case 'emotionalimpact':
            const emotions = Object.entries(insights.emotionalPatterns);
            const sortedEmotions = emotions
              .map(([emotion, outcomes]: [string, any]) => ({
                emotion,
                successRate: outcomes.better / (outcomes.better + outcomes.worse + outcomes.as_expected || 1),
                totalDecisions: outcomes.better + outcomes.worse + outcomes.as_expected,
              }))
              .sort((a, b) => b.successRate - a.successRate);

            const bestEmotion = sortedEmotions[0];
            detailData.value = bestEmotion ? `${bestEmotion.emotion} (${Math.round(bestEmotion.successRate * 100)}% success)` : 'Not enough data';
            detailData.insights = sortedEmotions.slice(0, 5).map(e =>
              `${e.emotion}: ${Math.round(e.successRate * 100)}% success rate (${e.totalDecisions} decisions)`
            );
            detailData.recommendations = [
              'Pay attention to your emotional state before making decisions.',
              'Consider postponing decisions when in negative emotional states.',
              'Your best emotional state for decisions appears to be ' + (bestEmotion?.emotion || 'unknown'),
            ];
            break;

          case 'categoryperformance':
            // Feature #207: Category performance - success rate per category, decision count
            // Use topCategories from backend which includes positiveRate
            const categoryData = insights.topCategories || [];
            const sortedCategories = categoryData
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 10);

            detailData.value = sortedCategories.length > 0
              ? `${sortedCategories.length} categories tracked`
              : 'Not enough data';
            // Feature #207: Show both decision count AND success rate per category
            detailData.insights = sortedCategories.map((cat: any) => {
              const successRate = Math.round(cat.positiveRate * 100);
              return `${cat.category}: ${cat.count} decisions (${successRate}% positive rate)`;
            });
            detailData.recommendations = [
              'Diversify your decision categories to get more balanced insights.',
              'Consider which categories need more attention in your life.',
              'Track outcomes by category to identify strengths and weaknesses.',
              'Categories with lower success rates may need more deliberation time.',
            ];
            break;

          case 'decisioncount':
            detailData.value = `${insights.totalDecisions} decisions`;
            detailData.insights = [
              `Total decisions recorded: ${insights.totalDecisions}`,
              `Decisions with outcomes: ${insights.decisionsWithOutcomes}`,
              `Completion rate: ${insights.totalDecisions > 0
                ? Math.round((insights.decisionsWithOutcomes / insights.totalDecisions) * 100)
                : 0}%`,
            ];
            detailData.recommendations = insights.totalDecisions < 10
              ? [
                  'Record more decisions to unlock deeper insights.',
                  'Aim to record at least 10 decisions to see meaningful patterns.',
                  'Include both small and large decisions for comprehensive tracking.',
                ]
              : insights.totalDecisions < 50
              ? [
                  'You\'re building a good foundation of decision data.',
                  'Continue recording decisions regularly.',
                  'Consider adding outcomes to more decisions for better insights.',
                ]
              : [
                  'Excellent tracking! You have substantial data for analysis.',
                  'Focus on adding outcomes to decisions that don\'t have them yet.',
                  'Your patterns are becoming clearer with more data.',
                ];
            break;

          case 'positionbias':
            if (insights.positionBias) {
              const bias = insights.positionBias;
              detailData.value = `Position #${bias.position}: ${bias.percentage}%`;
              detailData.insights = [
                `You chose position #${bias.position} ${bias.chosenCount} times out of ${bias.totalCount} decisions`,
                `This represents ${bias.percentage}% of your multi-option decisions`,
                bias.position === 1
                  ? 'You show a primacy bias - favoring the first option'
                  : bias.position === (insights.positionBias.totalCount / insights.positionBias.chosenCount || 2)
                  ? 'You show a recency bias - favoring the last option'
                  : 'You have a middle-position preference',
              ];
              detailData.recommendations = bias.percentage >= 50
                ? [
                    'Be aware of your tendency to favor certain positions.',
                    'When listing options, consider randomizing their order.',
                    'Force yourself to thoroughly evaluate all options, not just your preferred position.',
                    'Ask "What if I reversed the order?" when making decisions.',
                  ]
                : [
                    'You show balanced decision-making across option positions.',
                    'Continue considering all options carefully.',
                  ];
            } else {
              detailData.value = 'No bias detected';
              detailData.insights = ['You don\'t show a strong position bias in your decisions.'];
              detailData.recommendations = [
                'Continue evaluating all options evenly.',
                'Your balanced approach is a strength in decision-making.',
              ];
            }
            break;

          default:
            detailData.value = 'Pattern analysis';
            detailData.insights = ['Pattern data available'];
            detailData.recommendations = ['Continue tracking decisions for better insights.'];
        }

        setPatternData(detailData);
      } catch (error) {
        console.error('Error fetching pattern details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatternDetails();
  }, [patternId, patternKey, metadata, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SkipLink />
        <main id="main-content" className="text-center" role="main" aria-label="Loading">
          <motion.div
            className="w-16 h-16 mx-auto rounded-full border-4 border-accent border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          />
          <p className="text-text-secondary text-sm mt-4">Loading pattern details...</p>
        </main>
        <div className="grain-overlay" aria-hidden="true" />
      </div>
    );
  }

  if (!patternData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SkipLink />
        <main id="main-content" className="text-center" role="main" aria-label="Pattern not found">
          <h1 className="text-2xl font-semibold mb-4">Pattern Not Found</h1>
          <p className="text-text-secondary mb-6">Unable to load pattern details.</p>
          <Link to="/insights">
            <motion.button
              className="px-6 py-2 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Insights
            </motion.button>
          </Link>
        </main>
        <div className="grain-overlay" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <SkipLink />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/insights"
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
            aria-label="Back to Insights"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <motion.h1
            className="text-xl font-semibold flex-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {patternData.title}
          </motion.h1>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6" tabIndex={-1}>
        {/* Pattern Hero */}
        <motion.div
          className="glass p-6 rounded-2xl rim-light mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metadata.color} bg-opacity-20 flex items-center justify-center`}>
              <div className={`text-gradient bg-gradient-to-r ${metadata.color} bg-clip-text text-transparent`}>
                {metadata.icon}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-text-secondary text-sm mb-1">{patternData.description}</p>
              <p className="text-2xl font-bold text-gradient">{patternData.value}</p>
            </div>
          </div>
        </motion.div>

        {/* Key Insights */}
        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-3">Key Insights</h2>
          <div className="glass p-5 rounded-2xl rim-light">
            <ul className="space-y-3">
              {patternData.insights.map((insight, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span className="text-text-secondary">{insight}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Recommendations */}
        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-3">Recommendations</h2>
          <div className="space-y-3">
            {patternData.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                className="glass p-4 rounded-xl rim-light"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  </div>
                  <p className="text-text-secondary text-sm flex-1">{recommendation}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Back to Insights */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/insights">
            <motion.button
              className="px-6 py-2.5 glass glass-hover rounded-full font-medium transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Insights Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default PatternDetailPage;
