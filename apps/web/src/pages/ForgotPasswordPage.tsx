import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="w-full max-w-md text-center"
        >
          <div className="glass p-8 rounded-2xl rim-light">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-text-secondary mb-6">
              We've sent password reset instructions to <strong className="text-text-primary">{email}</strong>
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent-400 transition-all duration-200"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
        <div className="grain-overlay" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <Link to="/">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          </Link>
          <h1 className="text-2xl font-semibold text-gradient">Reset Password</h1>
          <p className="text-text-secondary mt-2">Enter your email to receive reset instructions</p>
        </div>

        {/* Reset card */}
        <div className="glass p-8 rounded-2xl rim-light">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          {/* Back to login link */}
          <p className="mt-6 text-center text-text-secondary text-sm">
            Remember your password?{' '}
            <Link to="/login" className="text-accent hover:text-accent-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default ForgotPasswordPage;
