import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ConfirmModal } from '../components/Modal';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SkipLink } from '../components/SkipLink';
import { useToast } from '../contexts/ToastContext';

// Type definitions
interface DecisionOption {
  id: string;
  text: string;
  pros: string[];
  cons: string[];
  isChosen?: boolean;
}

// Feature #77: Multiple outcomes support
interface Outcome {
  id: string;
  result: 'better' | 'worse' | 'as_expected';
  satisfaction: number | null;
  notes: string | null;
  recordedAt: string;
  check_in_number: number;
  scheduled_for?: string;
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
  outcome?: string; // Legacy single outcome
  outcome_notes?: string; // Legacy
  outcome_recorded_at?: string; // Legacy
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
                <span>{typeof pro === 'string' ? pro : pro.content}</span>
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
                <span>{typeof con === 'string' ? con : con.content}</span>
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

// Reminder interface
interface Reminder {
  id: string;
  decision_id: string;
  user_id: string;
  remind_at: string;
  status: string;
  created_at: string;
}

export function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast(); // Feature #221: Add toast for delete confirmation
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false); // Feature #266: Track if decision was deleted
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Feature #88: Abandon decision state
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [abandonReason, setAbandonReason] = useState('');
  const [abandonNote, setAbandonNote] = useState('');
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcomeResult, setOutcomeResult] = useState<string>('');
  const [outcomeSatisfaction, setOutcomeSatisfaction] = useState<number>(3);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [isRecordingOutcome, setIsRecordingOutcome] = useState(false);
  // Feature #77: Multiple outcomes state
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  // Reminder state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [isSettingReminder, setIsSettingReminder] = useState(false);

  // Feature #268: Add AbortController to prevent race conditions during rapid navigation
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

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
          signal, // Feature #268: Pass abort signal
        });

        if (response.status === 404) {
          setError('Decision not found');
          return;
        }

        // Feature #266: Handle 410 Gone (decision deleted)
        if (response.status === 410) {
          setIsDeleted(true);
          setError('This decision has been deleted.');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch decision');
        }

        const data = await response.json();
        setDecision(data);
      } catch (err: any) {
        // Feature #268: Don't show error if request was aborted
        if (err.name !== 'AbortError') {
          console.error('Error fetching decision:', err);
          setError('Failed to load decision');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDecision();

    // Feature #268: Cleanup function - abort fetch on unmount or id change
    return () => {
      abortController.abort();
    };
  }, [id, navigate]);

  // Fetch reminders for this decision
  // Feature #268: Add AbortController to prevent race conditions during rapid navigation
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function fetchReminders() {
      if (!id) return;

      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}/reminders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal, // Feature #268: Pass abort signal
        });

        if (response.ok) {
          const data = await response.json();
          setReminders(data.reminders || []);
        }
      } catch (err: any) {
        // Feature #268: Silently ignore abort errors
        if (err.name !== 'AbortError') {
          console.error('Error fetching reminders:', err);
        }
      }
    }

    fetchReminders();

    // Feature #77: Fetch outcomes for this decision
    async function fetchOutcomes() {
      if (!id) return;

      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}/outcomes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal, // Feature #268: Pass abort signal
        });

        if (response.ok) {
          const data = await response.json();
          setOutcomes(data.outcomes || []);
        }
      } catch (err: any) {
        // Feature #268: Silently ignore abort errors
        if (err.name !== 'AbortError') {
          console.error('Error fetching outcomes:', err);
        }
      }
    }

    fetchOutcomes();

    // Feature #268: Cleanup function - abort fetch on unmount or id change
    return () => {
      abortController.abort();
    };
  }, [id]);

  // Handle setting a reminder
  const handleSetReminder = async () => {
    if (!id || !reminderDate || !reminderTime || isSettingReminder) return;

    try {
      setIsSettingReminder(true);

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      // Combine date and time into a local datetime string
      // The browser creates this in user's local timezone
      const localDateTime = new Date(`${reminderDate}T${reminderTime}`);

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}/reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          remind_at: localDateTime.toISOString(),
          timezone: timezone,
        }),
      });

      // Feature #266: Handle 410 Gone (decision deleted by another user)
      if (response.status === 410) {
        setIsDeleted(true);
        const data = await response.json();
        setError(data.message || 'This decision has been deleted.');
        setShowReminderModal(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to set reminder');
      }

      const data = await response.json();

      // Add new reminder to list
      if (data.reminder) {
        setReminders(prev => [...prev, data.reminder]);
      }

      // Close modal and reset form
      setShowReminderModal(false);
      setReminderDate('');
      setReminderTime('');
    } catch (err) {
      console.error('Error setting reminder:', err);
      alert('Failed to set reminder. Please try again.');
    } finally {
      setIsSettingReminder(false);
    }
  };

  // Handle deleting a reminder
  const handleDeleteReminder = async (reminderId: string) => {
    if (!id) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReminders(prev => prev.filter(r => r.id !== reminderId));
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

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

      // Feature #221: Show success message indicating what was deleted
      const decisionTitle = decision?.title || 'Decision';
      showSuccess(`"${decisionTitle}" deleted`);

      // Navigate back to history after successful deletion
      navigate('/history', { replace: true });
    } catch (err) {
      console.error('Error deleting decision:', err);
      showError('Failed to delete decision');
      setError('Failed to delete decision');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Feature #88: Handle abandoning a decision
  const handleAbandon = async () => {
    if (!id || !abandonReason) return;

    try {
      setIsAbandoning(true);

      // Get auth token
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      // Abandon decision via API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}/abandon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abandonReason,
          abandonNote: abandonNote || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to abandon decision');
      }

      // Show success message
      showSuccess('Decision abandoned');

      // Refresh decision data
      fetchDecision();

      // Close modal
      setShowAbandonModal(false);
      setAbandonReason('');
      setAbandonNote('');
    } catch (err: any) {
      console.error('Error abandoning decision:', err);
      showError(err.message || 'Failed to abandon decision');
    } finally {
      setIsAbandoning(false);
    }
  };

  const handleRecordOutcome = async () => {
    // Prevent double-clicks / rapid submissions
    if (!id || !outcomeResult || isRecordingOutcome) return;

    try {
      setIsRecordingOutcome(true);

      // Get auth token
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      // Record outcome via API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}/outcomes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result: outcomeResult,
          satisfaction: outcomeSatisfaction,
          notes: outcomeNotes,
        }),
      });

      // Feature #266: Handle 410 Gone (decision deleted by another user)
      if (response.status === 410) {
        setIsDeleted(true);
        const data = await response.json();
        setError(data.message || 'This decision has been deleted.');
        setShowOutcomeModal(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to record outcome');
      }

      const data = await response.json();

      // Feature #77: Update local decision state and outcomes list
      if (decision && data.success) {
        setDecision({
          ...decision,
          outcome: data.outcome.result,
          outcome_notes: data.outcome.notes,
          outcome_recorded_at: data.outcome.recordedAt,
        });

        // Add new outcome to outcomes list
        setOutcomes(prev => [...prev, data.outcome]);
      }

      // Close modal and reset form
      setShowOutcomeModal(false);
      setOutcomeResult('');
      setOutcomeSatisfaction(3);
      setOutcomeNotes('');
    } catch (err) {
      console.error('Error recording outcome:', err);
      alert('Failed to record outcome. Please try again.');
    } finally {
      setIsRecordingOutcome(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="alert" aria-live="assertive">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center" aria-hidden="true">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium mb-2">{error}</h2>
          {isDeleted && (
            <p className="text-sm text-text-secondary mb-4">
              This decision may have been deleted by another user or session.
            </p>
          )}
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
      <SkipLink />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6" tabIndex={-1}>
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
        {/* Feature #77: Display multiple outcomes with check-in numbers */}
        {(outcomes.length > 0 || decision.outcome) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              {outcomes.length > 1 ? 'Check-ins' : 'Outcome'}
            </h3>

            {/* Display multiple outcomes if available */}
            {outcomes.length > 0 ? (
              <div className="space-y-3">
                {outcomes.map((outcome, index) => (
                  <div key={outcome.id} className="glass p-4 rounded-xl rim-light-accent">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Check-in number badge */}
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent">
                        {outcome.check_in_number === 1 ? '1st' :
                         outcome.check_in_number === 2 ? '2nd' :
                         outcome.check_in_number === 3 ? '3rd' :
                         `${outcome.check_in_number}th`} check-in
                      </span>

                      {/* Result badge */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        outcome.result === 'better' ? 'bg-emerald-500/20 text-emerald-400' :
                        outcome.result === 'worse' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {outcome.result.charAt(0).toUpperCase() + outcome.result.slice(1).replace('_', ' ')}
                      </span>

                      {/* Date */}
                      {outcome.recordedAt && (
                        <span className="text-xs text-text-secondary">
                          {formatDate(outcome.recordedAt)}
                        </span>
                      )}
                    </div>

                    {/* Satisfaction stars */}
                    {outcome.satisfaction && (
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= outcome.satisfaction! ? 'text-accent' : 'text-white/20'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {outcome.notes && (
                      <p className="text-text-secondary text-sm whitespace-pre-wrap mt-2">
                        {outcome.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : decision.outcome ? (
              // Legacy single outcome display
              <div className="glass p-4 rounded-xl rim-light-accent">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent">
                    1st check-in
                  </span>
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
            ) : null}
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
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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

        {/* Reminders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
              Reminders
            </h3>
            <button
              onClick={() => setShowReminderModal(true)}
              className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Set Reminder
            </button>
          </div>

          {reminders.length === 0 ? (
            <div className="glass p-4 rounded-xl rim-light text-center">
              <p className="text-text-secondary text-sm">No reminders set</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.map((reminder) => {
                const reminderDate = new Date(reminder.remind_at);
                const now = new Date();
                const isPast = reminderDate < now;
                const isToday = reminderDate.toDateString() === now.toDateString();

                return (
                  <div
                    key={reminder.id}
                    className={`glass p-3 rounded-xl ${isPast ? 'border border-amber-500/30' : 'rim-light'} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${isPast ? 'bg-amber-500/20' : 'bg-accent/20'} flex items-center justify-center`}>
                        <svg className={`w-4 h-4 ${isPast ? 'text-amber-400' : 'text-accent'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {isToday ? 'Today' : reminderDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {' at '}
                          {reminderDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {isPast ? 'Due' : reminder.status === 'completed' ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-secondary hover:text-rose-400"
                      aria-label="Delete reminder"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          {/* Record Outcome button - Feature #77: Allow multiple check-ins */}
          {(decision.status === 'decided' || decision.status === 'in_progress' || decision.status === 'reviewed') && (
            <button
              onClick={() => setShowOutcomeModal(true)}
              className="flex-1 px-4 py-2.5 bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent/90 transition-all text-sm"
            >
              {outcomes.length > 0 ? 'Record Another Check-in' : 'Record Outcome'}
            </button>
          )}
          <Link to={`/decisions/${id}/edit`} className="flex-1">
            <button className="w-full px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium">
              Edit Decision
            </button>
          </Link>
          {/* Feature #88: Abandon button - only show for non-abandoned decisions */}
          {decision.status !== 'abandoned' && (
            <button
              onClick={() => setShowAbandonModal(true)}
              className="px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium text-text-secondary"
            >
              Abandon
            </button>
          )}
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

      {/* Feature #88: Abandon confirmation modal */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-2xl p-6 rim-light"
          >
            <h3 className="text-xl font-semibold mb-2">Abandon Decision</h3>
            <p className="text-sm text-text-secondary mb-6">
              Why are you abandoning this decision?
            </p>

            {/* Abandon reason selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reason <span className="text-rose-400">*</span>
              </label>
              <select
                value={abandonReason}
                onChange={(e) => setAbandonReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
                required
              >
                <option value="">Select a reason...</option>
                <option value="too_complex">Too complex to decide</option>
                <option value="no_longer_relevant">No longer relevant</option>
                <option value="outside_influence">Outside factors decided for me</option>
                <option value="not_important">Not important anymore</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Optional note */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Note <span className="text-text-secondary">(optional)</span>
              </label>
              <textarea
                value={abandonNote}
                onChange={(e) => setAbandonNote(e.target.value)}
                placeholder="Add any additional context..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 transition-colors resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAbandonModal(false);
                  setAbandonReason('');
                  setAbandonNote('');
                }}
                disabled={isAbandoning}
                className="flex-1 px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAbandon}
                disabled={!abandonReason || isAbandoning}
                className="flex-1 px-4 py-2.5 bg-text-secondary/20 text-text-secondary font-medium rounded-xl hover:bg-text-secondary/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAbandoning ? 'Abandoning...' : 'Abandon Decision'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Outcome recording modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-2xl p-6 rim-light"
          >
            <h3 className="text-xl font-semibold mb-4">Record Outcome</h3>
            <p className="text-sm text-text-secondary mb-6">
              How did this decision turn out?
            </p>

            {/* Outcome result selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Result</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOutcomeResult('better')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    outcomeResult === 'better'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'glass border border-white/10 hover:bg-white/5'
                  }`}
                >
                  Better
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeResult('as_expected')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    outcomeResult === 'as_expected'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      : 'glass border border-white/10 hover:bg-white/5'
                  }`}
                >
                  As Expected
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeResult('worse')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    outcomeResult === 'worse'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                      : 'glass border border-white/10 hover:bg-white/5'
                  }`}
                >
                  Worse
                </button>
              </div>
            </div>

            {/* Satisfaction rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Satisfaction: {outcomeSatisfaction}/5
              </label>
              <div className="flex items-center gap-2" role="group" aria-label="Satisfaction rating">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setOutcomeSatisfaction(level)}
                    className={`p-2 rounded-lg transition-all ${
                      level <= outcomeSatisfaction
                        ? 'text-accent scale-110'
                        : 'text-white/20 hover:text-white/40'
                    }`}
                    aria-label={`${level} star${level > 1 ? 's' : ''}`}
                    aria-pressed={level <= outcomeSatisfaction}
                  >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
                placeholder="Any reflections on the outcome..."
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOutcomeModal(false);
                  setOutcomeResult('');
                  setOutcomeSatisfaction(3);
                  setOutcomeNotes('');
                }}
                className="flex-1 px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium"
                disabled={isRecordingOutcome}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordOutcome}
                disabled={!outcomeResult || isRecordingOutcome}
                className="flex-1 px-4 py-2.5 bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent/90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecordingOutcome ? 'Recording...' : 'Record'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Set Reminder modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-2xl p-6 rim-light"
          >
            <h3 className="text-xl font-semibold mb-4">Set Reminder</h3>
            <p className="text-sm text-text-secondary mb-6">
              Choose when you'd like to be reminded about this decision.
              The reminder will appear on your dashboard at the specified time.
            </p>

            {/* Date input */}
            <div className="mb-4">
              <label htmlFor="reminder-date" className="block text-sm font-medium mb-2">
                Date
              </label>
              <input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              />
            </div>

            {/* Time input */}
            <div className="mb-4">
              <label htmlFor="reminder-time" className="block text-sm font-medium mb-2">
                Time
              </label>
              <input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              />
            </div>

            {/* Timezone info */}
            <div className="mb-6 p-3 bg-accent/10 rounded-xl">
              <p className="text-sm text-accent">
                <span className="font-medium">Your timezone:</span>{' '}
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                The reminder will fire at the selected time in your local timezone.
              </p>
            </div>

            {/* Preview */}
            {reminderDate && reminderTime && (
              <div className="mb-6 p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Reminder will fire at:</span>
                </p>
                <p className="text-lg font-medium text-accent mt-1">
                  {new Date(`${reminderDate}T${reminderTime}`).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderDate('');
                  setReminderTime('');
                }}
                className="flex-1 px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium"
                disabled={isSettingReminder}
              >
                Cancel
              </button>
              <button
                onClick={handleSetReminder}
                disabled={!reminderDate || !reminderTime || isSettingReminder}
                className="flex-1 px-4 py-2.5 bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent/90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSettingReminder ? 'Setting...' : 'Set Reminder'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default DecisionDetailPage;
