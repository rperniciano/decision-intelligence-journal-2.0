import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SkipLink } from './components/SkipLink';

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
const PatternDetailPage = lazy(() => import('./pages/PatternDetailPage').then(m => ({ default: m.PatternDetailPage })));

// Landing Page Component
function LandingPage() {
  const steps = [
    {
      number: "01",
      title: "Speak",
      description: "Record your decision naturally. Just talk through what you're thinking.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      number: "02",
      title: "AI Extracts",
      description: "Our AI identifies options, pros/cons, and emotional context from your words.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      number: "03",
      title: "Discover Patterns",
      description: "Track outcomes over time and reveal insights about your decision-making.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen">
      <SkipLink />
      <main id="main-content" role="main" aria-label="Welcome to Decisions">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-bg-deep via-bg-deep to-[#1a1a2e] opacity-50" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-accent/5 animate-pulse" aria-hidden="true" style={{ animationDuration: '8s' }} />

          <div className="relative z-10 text-center px-4">
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
              <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-gradient">Decisions</h1>
              <p className="text-text-secondary text-lg md:text-xl mb-8 max-w-md mx-auto">
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
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 md:px-8 relative" aria-labelledby="how-it-works-heading">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="text-center mb-16"
            >
              <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-semibold mb-4">
                How It Works
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Transform how you make decisions with the power of voice and AI
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 1, 0.5, 1],
                    delay: index * 0.1
                  }}
                  className="glass rounded-2xl p-8 hover:glow-accent transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      {step.icon}
                    </div>
                    <div className="text-5xl font-bold text-accent/20 font-mono">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center relative" aria-labelledby="cta-heading">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <h2 id="cta-heading" className="text-3xl md:text-4xl font-semibold mb-6">
                Ready to make better decisions?
              </h2>
              <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
                Start your journal today and discover the patterns in your decision-making.
              </p>
              <Link to="/register">
                <motion.button
                  className="px-10 py-4 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all duration-200 text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Begin Your Journal
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>
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
      <SkipLink />
      <main id="main-content" role="main" aria-label={title}>
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
      <SkipLink />
      <main id="main-content" className="text-center" role="main" aria-label="Loading">
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
      <SkipLink />
      <main id="main-content" className="text-center" role="main" aria-label="Page not found">
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
      <ThemeProvider>
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
            path="/insights/patterns/:patternId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <PatternDetailPage />
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
      </ThemeProvider>
    </MotionConfig>
  );
}

export default App;
