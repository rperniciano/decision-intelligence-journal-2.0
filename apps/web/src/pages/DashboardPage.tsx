import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { SkipLink } from '../components/SkipLink';
import { useState, useEffect } from 'react';
import { showErrorAlert } from '../utils/errorHandling';

interface Statistics {
  totalDecisions: number;
  positiveOutcomePercentage: number;
  decisionScore: number;
}

interface PendingReview {
  id: string;
  decision_id: string;
  remind_at: string;
  status: string;
  decisions: {
    id: string;
    title: string;
    status: string;
    category: string;
    decided_at: string;
  };
}

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<Statistics>({
    totalDecisions: 0,
    positiveOutcomePercentage: 0,
    decisionScore: 50,
  });
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Fetch statistics on mount
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem('sb-doqojfsldvajmlscpwhu-auth-token');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const authData = JSON.parse(token);
        const accessToken = authData.access_token;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/stats`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const stats = await response.json();
        setStatistics(stats);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        showErrorAlert(error, 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Fetch pending reviews on mount
  useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        const token = localStorage.getItem('sb-doqojfsldvajmlscpwhu-auth-token');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const authData = JSON.parse(token);
        const accessToken = authData.access_token;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/pending-reviews`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pending reviews');
        }

        const data = await response.json();
        setPendingReviews(data.pendingReviews || []);
      } catch (error) {
        console.error('Error fetching pending reviews:', error);
        // Silently fail for pending reviews as it's not critical
        // Only show alert for network errors to avoid spamming user
        // (pending-reviews endpoint has known issues)
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchPendingReviews();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen pb-20">
      <SkipLink />
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent-subtle" />
              <span className="font-semibold text-lg">Decisions</span>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 min-h-[44px] text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" tabIndex={-1}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">
              {getGreeting()}, <span className="text-gradient">{displayName}</span>
            </h1>
            <p className="text-text-secondary">Ready to make better decisions?</p>
          </div>

          {/* Record button hero */}
          <div className="flex flex-col items-center justify-center py-16">
            <motion.button
              onClick={() => navigate('/record')}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent-strong flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', mass: 1, damping: 15 }}
            >
              <svg className="w-12 h-12 text-bg-deep" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </motion.button>
            <p className="mt-6 text-text-secondary">Tap to record a decision</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <motion.div
              className="glass p-6 rounded-2xl rim-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-3xl font-bold text-gradient">
                {loading ? '...' : statistics.totalDecisions}
              </div>
              <div className="text-text-secondary text-sm mt-1">Total Decisions</div>
            </motion.div>

            <motion.div
              className="glass p-6 rounded-2xl rim-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-3xl font-bold text-success">
                {loading ? '...' : `${statistics.positiveOutcomePercentage}%`}
              </div>
              <div className="text-text-secondary text-sm mt-1">Positive Outcomes</div>
            </motion.div>

            <motion.div
              className="glass p-6 rounded-2xl rim-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-3xl font-bold text-accent">
                {loading ? '...' : statistics.decisionScore}
              </div>
              <div className="text-text-secondary text-sm mt-1">Decision Score</div>
            </motion.div>
          </div>

          {/* Pending Reviews Section */}
          {!reviewsLoading && pendingReviews.length > 0 && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold mb-4">Pending Reviews</h2>
              <div className="space-y-3">
                {pendingReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    className="glass p-4 rounded-xl rim-light cursor-pointer hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    onClick={() => navigate(`/decisions/${review.decision_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary mb-1">
                          {review.decisions.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                          <span className="px-2 py-1 rounded-lg bg-white/5 text-xs">
                            {review.decisions.category}
                          </span>
                          <span>
                            Due {new Date(review.remind_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-accent">Review</span>
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state for recent decisions */}
          <motion.div
            className="mt-12 text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No decisions yet</h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              Record your first decision to start building your decision intelligence journal.
              Your patterns and insights will appear here over time.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default DashboardPage;
