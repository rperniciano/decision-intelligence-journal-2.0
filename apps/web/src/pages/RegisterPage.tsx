import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { SkipLink } from '../components/SkipLink';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation with accessible error messages
    const newFieldErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newFieldErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newFieldErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newFieldErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newFieldErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      // Set general error for screen readers
      setError('Please fix the errors below and try again.');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setLoading(true);

    const { error } = await signUpWithEmail(email, password, name);

    if (error) {
      setError(error.message);
      setLoading(false);
      isSubmittingRef.current = false;
    } else {
      setSuccess(true);
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <main className="w-full max-w-md text-center" role="main" aria-label="Registration success">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="glass p-8 rounded-2xl rim-light">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center" aria-hidden="true">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Check your email</h2>
              <p className="text-text-secondary mb-6">
                We've sent you a confirmation link to <strong className="text-text-primary">{email}</strong>
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-6 min-h-[44px] bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent-400 transition-all duration-200"
              >
                Go to Login
              </Link>
            </div>
          </motion.div>
        </main>
        <div className="grain-overlay" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SkipLink />
      <main id="main-content" className="w-full max-w-md" role="main" aria-label="Create account">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Logo and title */}
          <header className="text-center mb-8">
            <Link to="/" aria-label="Go to homepage">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-hidden="true"
              />
            </Link>
            <h1 className="text-2xl font-semibold text-gradient">Create Account</h1>
            <p className="text-text-secondary mt-2">Begin your decision intelligence journey</p>
          </header>

        {/* Register card */}
        <div className="glass p-8 rounded-2xl rim-light">
          {/* Google Sign Up */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-all duration-200 mb-6 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-deep text-text-secondary">or</span>
            </div>
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailRegister} className="space-y-4" noValidate>
            {error && (
              <motion.div
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm"
              >
                {error}
                {error.toLowerCase().includes('already registered') && (
                  <div className="mt-2 text-text-secondary">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent hover:text-accent-400 transition-colors underline">
                      Sign in instead
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors(prev => ({ ...prev, name: undefined }));
                  }
                }}
                aria-invalid={fieldErrors.name ? 'true' : 'false'}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
                placeholder="Your name"
              />
              {fieldErrors.name && (
                <motion.div
                  id="name-error"
                  role="alert"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-error"
                >
                  {fieldErrors.name}
                </motion.div>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }
                }}
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <motion.div
                  id="email-error"
                  role="alert"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-error"
                >
                  {fieldErrors.email}
                </motion.div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                aria-invalid={fieldErrors.password ? 'true' : 'false'}
                aria-describedby={
                  fieldErrors.password
                    ? 'password-error'
                    : 'password-requirement'
                }
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
                placeholder="••••••••"
              />
              {fieldErrors.password ? (
                <motion.div
                  id="password-error"
                  role="alert"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-error"
                >
                  {fieldErrors.password}
                </motion.div>
              ) : (
                <p id="password-requirement" className="mt-1 text-xs text-text-secondary">
                  Minimum 6 characters
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
                placeholder="••••••••"
              />
              {fieldErrors.confirmPassword && (
                <motion.div
                  id="confirm-password-error"
                  role="alert"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-error"
                >
                  {fieldErrors.confirmPassword}
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-text-secondary text-sm flex items-center justify-center gap-1">
            Already have an account?
            <Link to="/login" className="text-accent hover:text-accent-400 transition-colors min-h-[44px] flex items-center px-2">
              Sign in
            </Link>
          </p>
        </div>
        </motion.div>
      </main>

      {/* Grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}

export default RegisterPage;
