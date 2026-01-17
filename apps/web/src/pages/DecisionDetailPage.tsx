import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ConfirmModal } from '../components/Modal';
import { Breadcrumbs } from '../components/Breadcrumbs';

// Type definitions
interface DecisionOption {
  id: string;
  text: string;
  pros: string[];
  cons: string[];
  isChosen?: boolean;
}

interface Decision {
  id: string;
  title: string;
  status: 'draft' | 'deliberating' | 'decided' | 'abandoned' | 'reviewed' | 'in_progress';
  category: string;
  emotionalState?: string;
  createdAt: string;
  decidedAt?: string;
  options: DecisionOption[];
  notes?: string;
  transcription?: string;
  outcome?: string;
  outcome_notes?: string;
  outcome_recorded_at?: string;
  abandon_reason?: string;
  abandon_note?: string;
}

// Status badge component
function StatusBadge({ status }: { status: Decision['status'] }) {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-white/10 text-text-secondary' },
    deliberating: { label: 'Deliberating', className: 'bg-amber-500/20 text-amber-400' },
    decided: { label: 'Decided', className: 'bg-accent/20 text-accent' },
    abandoned: { label: 'Abandoned', className: 'bg-white/5 text-text-secondary' },
    reviewed: { label: 'Reviewed', className: 'bg-emerald-500/20 text-emerald-400' },
    in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-400' },
  };

  const config = statusConfig[status] || { label: status || 'Unknown', className: 'bg-white/10 text-text-secondary' };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Option card component
function OptionCard({ option, index }: { option: DecisionOption; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`glass p-4 rounded-xl ${option.isChosen ? 'rim-light-accent' : 'rim-light'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-text-primary">{option.text}</h3>
        {option.isChosen && (
          <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">
            Chosen
          </span>
        )}
      </div>

      {option.pros.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-emerald-400 mb-1.5">Pros</h4>
          <ul className="space-y-1">
            {option.pros.map((pro, idx) => (
              <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {option.cons.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-rose-400 mb-1.5">Cons</h4>
          <ul className="space-y-1">
            {option.cons.map((con, idx) => (
              <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">✗</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="h-8 bg-white/5 rounded-lg w-32 animate-pulse" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="h-8 bg-white/5 rounded-lg w-3/4 animate-pulse" />
          <div className="h-6 bg-white/5 rounded-lg w-1/2 animate-pulse" />
          <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </main>
    </div>
  );
}

export function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchDecision() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch decision data
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) {
          setError('Not authenticated');
          navigate('/login');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          setError('Decision not found');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch decision');
        }

        const data = await response.json();
        setDecision(data);
      } catch (err) {
        console.error('Error fetching decision:', err);
        setError('Failed to load decision');
      } finally {
        setLoading(false);
      }
    }

    fetchDecision();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);

      // Get auth token
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      // Delete decision
      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete decision');
      }

      // Navigate back to history after successful deletion
      navigate('/history', { replace: true });
    } catch (err) {
      console.error('Error deleting decision:', err);
      setError('Failed to delete decision');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium mb-2">{error}</h2>
          <Link to="/history">
            <motion.button
              className="px-6 py-2 glass glass-hover rounded-full text-sm font-medium mt-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to History
            </motion.button>
          </Link>
        </motion.div>
        <div className="grain-overlay" />
      </div>
    );
  }

  if (!decision) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <motion.h1
              className="text-xl font-semibold flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Decision Details
            </motion.h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'History', path: '/history' },
            { label: decision.title }
          ]}
        />

        {/* Title and status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-2xl font-semibold text-text-primary">{decision.title}</h2>
            <StatusBadge status={decision.status} />
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span>{decision.category}</span>
            {decision.emotionalState && (
              <>
                <span className="text-text-secondary/30">•</span>
                <span>{decision.emotionalState}</span>
              </>
            )}
            <span className="text-text-secondary/30">•</span>
            <span>{formatDate(decision.createdAt)}</span>
          </div>
        </motion.div>

        {/* Options */}
        {decision.options && decision.options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Options ({decision.options.length})
            </h3>
            <div className="space-y-3">
              {decision.options.map((option, index) => (
                <OptionCard key={option.id} option={option} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Notes */}
        {decision.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Notes
            </h3>
            <div className="glass p-4 rounded-xl rim-light">
              <p className="text-text-secondary text-sm whitespace-pre-wrap">{decision.notes}</p>
            </div>
          </motion.div>
        )}

        {/* Transcription */}
        {decision.transcription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Transcription
            </h3>
            <div className="glass p-4 rounded-xl rim-light">
              <p className="text-text-secondary text-sm whitespace-pre-wrap italic">"{decision.transcription}"</p>
            </div>
          </motion.div>
        )}

        {/* Outcome */}
        {decision.outcome && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Outcome
            </h3>
            <div className="glass p-4 rounded-xl rim-light-accent">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  decision.outcome === 'better' ? 'bg-emerald-500/20 text-emerald-400' :
                  decision.outcome === 'worse' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {decision.outcome.charAt(0).toUpperCase() + decision.outcome.slice(1)}
                </span>
                {decision.outcome_recorded_at && (
                  <span className="text-xs text-text-secondary">
                    Recorded {formatDate(decision.outcome_recorded_at)}
                  </span>
                )}
              </div>
              {decision.outcome_notes && (
                <p className="text-text-secondary text-sm whitespace-pre-wrap mt-2">
                  {decision.outcome_notes}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Abandon Reason */}
        {decision.status === 'abandoned' && decision.abandon_reason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Why Abandoned
            </h3>
            <div className="glass p-4 rounded-xl border border-red-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-400 font-medium text-sm mb-1">
                    {decision.abandon_reason}
                  </p>
                  {decision.abandon_note && (
                    <p className="text-text-secondary text-sm whitespace-pre-wrap mt-2 pt-2 border-t border-white/5">
                      {decision.abandon_note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex gap-3"
        >
          <Link to={`/decisions/${id}/edit`} className="flex-1">
            <button className="w-full px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium">
              Edit Decision
            </button>
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium text-rose-400"
          >
            Delete
          </button>
        </motion.div>
      </main>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Decision"
        message="Are you sure you want to delete this decision? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default DecisionDetailPage;
