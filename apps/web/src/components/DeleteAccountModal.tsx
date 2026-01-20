import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { session, signOut } = useAuth();
  const { showError, showSuccess } = useToast();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      showError('Password is required');
      return;
    }

    if (confirmText !== 'DELETE') {
      showError('Please type DELETE to confirm');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password,
          confirm: confirmText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      showSuccess('Account marked for deletion. You have 30 days to cancel.');

      // Sign out the user
      await signOut();

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPassword('');
      setConfirmText('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="glass rounded-2xl rim-light w-full max-w-md overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/5">
                <h2
                  id="delete-account-title"
                  className="text-xl font-semibold text-red-400"
                >
                  Delete Account
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  This action cannot be undone
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-300 leading-relaxed">
                    <strong className="text-red-400">Warning:</strong> Deleting your account will:
                  </p>
                  <ul className="text-sm text-red-300 mt-2 space-y-1 list-disc list-inside">
                    <li>Permanently delete all your decisions</li>
                    <li>Delete all your outcomes and insights</li>
                    <li>Delete all your custom categories</li>
                    <li>Remove all your personal data</li>
                  </ul>
                  <p className="text-sm text-red-300 mt-3">
                    <strong className="text-red-400">30-day grace period:</strong> You can recover your account
                    within 30 days by contacting support.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Password field */}
                  <div>
                    <label
                      htmlFor="delete-password"
                      className="block text-sm font-medium text-text-secondary mb-2"
                    >
                      Enter your password to confirm
                    </label>
                    <input
                      id="delete-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                               focus:outline-none focus:border-accent/50 text-text-primary
                               placeholder-white/30 transition-colors"
                      placeholder="Your password"
                      disabled={isSubmitting}
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Confirmation field */}
                  <div>
                    <label
                      htmlFor="delete-confirm"
                      className="block text-sm font-medium text-text-secondary mb-2"
                    >
                      Type <span className="text-accent font-mono">DELETE</span> to confirm
                    </label>
                    <input
                      id="delete-confirm"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                               focus:outline-none focus:border-accent/50 text-text-primary
                               placeholder-white/30 transition-colors"
                      placeholder="DELETE"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-text-secondary
                               hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !password || confirmText !== 'DELETE'}
                      className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30
                               text-red-400 font-medium hover:bg-red-500/30 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
