import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Placeholder pages - to be implemented
function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent-strong animate-pulse-glow" />
        <h1 className="text-4xl font-semibold mb-4 text-gradient">Decisions</h1>
        <p className="text-text-secondary text-lg mb-8">
          Your voice-first decision intelligence journal
        </p>
        <button className="px-8 py-3 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all duration-200 transform hover:scale-105">
          Begin Your Journal
        </button>
      </div>
      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-text-secondary">Your decisions will appear here.</p>
      <div className="grain-overlay" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <p className="text-text-secondary text-lg mb-8">Page not found</p>
        <a
          href="/"
          className="px-6 py-2 glass glass-hover rounded-full transition-all duration-200"
        >
          Go Home
        </a>
      </div>
      <div className="grain-overlay" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes - to be wrapped with auth */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/decisions" element={<Dashboard />} />
        <Route path="/decisions/:id" element={<Dashboard />} />
        <Route path="/history" element={<Dashboard />} />
        <Route path="/insights" element={<Dashboard />} />
        <Route path="/settings" element={<Dashboard />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
