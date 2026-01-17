import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExportPage } from './pages/ExportPage';
import { RecordPage } from './pages/RecordPage';
import { DecisionDetailPage } from './pages/DecisionDetailPage';
import { EditDecisionPage } from './pages/EditDecisionPage';
import { CreateDecisionPage } from './pages/CreateDecisionPage';
import { DecisionDetailPageTest } from './pages/DecisionDetailPageTest';
import { EditDecisionPageTest } from './pages/EditDecisionPageTest';
import { OnboardingPage } from './pages/OnboardingPage';

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        className="text-center"
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
        />
        <h1 className="text-4xl font-semibold mb-4 text-gradient">Decisions</h1>
        <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
          Your voice-first decision intelligence journal. Speak your decisions, discover your patterns.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
        </div>
      </motion.div>
      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

// Placeholder page for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      <p className="text-text-secondary">This page is coming soon.</p>
      <div className="grain-overlay" />
    </div>
  );
}

// 404 Page
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        className="text-center"
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
      <div className="grain-overlay" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

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
                <DecisionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions/:id/edit"
            element={
              <ProtectedRoute>
                <EditDecisionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions/new"
            element={
              <ProtectedRoute>
                <CreateDecisionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <InsightsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/export"
            element={
              <ProtectedRoute>
                <ExportPage />
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
          <Route
            path="/test-modal"
            element={
              <ProtectedRoute>
                <DecisionDetailPageTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-edit"
            element={
              <ProtectedRoute>
                <EditDecisionPageTest />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
