import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Light pages - loaded immediately (no lazy loading for these)
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecordPage } from './pages/RecordPage';

// Heavy pages - lazy loaded for code splitting
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ExportPage = lazy(() => import('./pages/ExportPage').then(m => ({ default: m.ExportPage })));
const DecisionDetailPage = lazy(() => import('./pages/DecisionDetailPage').then(m => ({ default: m.DecisionDetailPage })));
const EditDecisionPage = lazy(() => import('./pages/EditDecisionPage').then(m => ({ default: m.EditDecisionPage })));
const CreateDecisionPage = lazy(() => import('./pages/CreateDecisionPage').then(m => ({ default: m.CreateDecisionPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="text-center" role="main" aria-label="Welcome to Decisions">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent-strong"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            aria-hidden="true"
          />
          <h1 className="text-4xl font-semibold mb-4 text-gradient">Decisions</h1>
          <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
            Your voice-first decision intelligence journal. Speak your decisions, discover your patterns.
          </p>
          <nav className="flex flex-col sm:flex-row gap-4 justify-center" aria-label="Get started">
            <Link to="/register">
              <motion.button
                className="px-8 py-3 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Begin Your Journal
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                className="px-8 py-3 glass glass-hover rounded-full font-medium transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </Link>
          </nav>
        </motion.div>
      </main>
      {/* Grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}

// Placeholder page for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen p-8">
      <main role="main" aria-label={title}>
        <h1 className="text-2xl font-semibold mb-4">{title}</h1>
        <p className="text-text-secondary">This page is coming soon.</p>
      </main>
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}

// Loading fallback for lazy-loaded components
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="text-center" role="main" aria-label="Loading">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-accent border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          />
          <p className="text-text-secondary text-sm">Loading...</p>
        </motion.div>
      </main>
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}

// 404 Page
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="text-center" role="main" aria-label="Page not found">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
          <p className="text-text-secondary text-lg mb-8">Page not found</p>
          <Link to="/">
            <motion.button
              className="px-6 py-2 glass glass-hover rounded-full transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go Home
            </motion.button>
          </Link>
        </motion.div>
      </main>
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={
            <Suspense fallback={<PageLoader />}>
              <OnboardingPage />
            </Suspense>
          } />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Decisions" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions/:id"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <DecisionDetailPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions/:id/edit"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <EditDecisionPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions/new"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CreateDecisionPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <HistoryPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <InsightsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/export"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <ExportPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CategoriesPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/record"
            element={
              <ProtectedRoute>
                <RecordPage />
              </ProtectedRoute>
            }
          />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  );
}

export default App;
