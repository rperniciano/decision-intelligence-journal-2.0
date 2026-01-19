// Temporary test page with mock data to test modal functionality
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ConfirmModal } from '../components/Modal';

// Mock decision data
const mockDecision = {
  id: 'test-123',
  title: 'Test Decision for Modal',
  status: 'decided' as const,
  category: 'Testing',
  emotionalState: 'Confident',
  createdAt: new Date().toISOString(),
  options: [
    {
      id: '1',
      text: 'Option A',
      pros: ['Pro 1', 'Pro 2'],
      cons: ['Con 1'],
      isChosen: true
    },
    {
      id: '2',
      text: 'Option B',
      pros: ['Pro 1'],
      cons: ['Con 1', 'Con 2']
    }
  ],
  notes: 'This is a test decision to verify modal functionality.'
};

// Status badge component
function StatusBadge({ status }: { status: typeof mockDecision.status }) {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-white/10 text-text-secondary' },
    deliberating: { label: 'Deliberating', className: 'bg-amber-500/20 text-amber-400' },
    decided: { label: 'Decided', className: 'bg-accent/20 text-accent' },
    abandoned: { label: 'Abandoned', className: 'bg-white/5 text-text-secondary' },
    reviewed: { label: 'Reviewed', className: 'bg-emerald-500/20 text-emerald-400' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Option card component
function OptionCard({ option, index }: { option: typeof mockDecision.options[0]; index: number }) {
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

export function DecisionDetailPageTest() {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const decision = mockDecision;

  const handleDelete = async () => {
    console.log('Delete confirmed - simulating deletion...');
    setIsDeleting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Deletion complete - redirecting to history');
    setIsDeleting(false);
    setShowDeleteModal(false);

    // Navigate back to history after successful deletion
    navigate('/history', { replace: true });
  };

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
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <motion.h1
              className="text-xl font-semibold flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Decision Details (Test Mode)
            </motion.h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
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

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex gap-3"
        >
          <Link to={`/decisions/${decision.id}/edit`} className="flex-1">
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

export default DecisionDetailPageTest;
