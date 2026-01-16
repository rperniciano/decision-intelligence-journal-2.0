import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

// Type definitions
interface Decision {
  id: string;
  title: string;
  status: 'draft' | 'deliberating' | 'decided' | 'abandoned' | 'reviewed';
  category: string;
  emotionalState?: string;
  createdAt: string;
  decidedAt?: string;
  chosenOption?: string;
}

// Status badge component
function StatusBadge({ status }: { status: Decision['status'] }) {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-white/10 text-text-secondary' },
    deliberating: { label: 'Deliberating', className: 'bg-amber-500/20 text-amber-400' },
    decided: { label: 'Decided', className: 'bg-accent/20 text-accent' },
    abandoned: { label: 'Abandoned', className: 'bg-white/5 text-text-secondary' },
    reviewed: { label: 'Reviewed', className: 'bg-emerald-500/20 text-emerald-400' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Decision card component
function DecisionCard({ decision, index }: { decision: Decision; index: number }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/decisions/${decision.id}`}>
        <div className="glass p-4 rounded-xl rim-light hover:bg-white/[0.03] transition-colors cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary truncate">{decision.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-text-secondary">{decision.category}</span>
                {decision.emotionalState && (
                  <>
                    <span className="text-text-secondary/30">•</span>
                    <span className="text-xs text-text-secondary">{decision.emotionalState}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={decision.status} />
              <span className="text-xs text-text-secondary">{formatDate(decision.createdAt)}</span>
            </div>
          </div>
          {decision.chosenOption && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-text-secondary">Chose: </span>
              <span className="text-xs text-accent">{decision.chosenOption}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
        <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No decisions yet</h3>
      <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">
        Start recording your decisions to build your history. Each decision becomes part of your journey.
      </p>
      <Link to="/record">
        <motion.button
          className="px-6 py-2.5 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Record Your First Decision
        </motion.button>
      </Link>
    </motion.div>
  );
}

// Filter chips
const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'deliberating', label: 'Deliberating' },
  { id: 'decided', label: 'Decided' },
  { id: 'reviewed', label: 'Reviewed' },
];

export function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [decisions] = useState<Decision[]>([]); // Will be populated from API

  // Filter decisions based on search and filter
  const filteredDecisions = decisions.filter((decision) => {
    const matchesSearch = decision.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || decision.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <motion.h1
            className="text-2xl font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            History
          </motion.h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Search bar */}
        <motion.div
          className="relative mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
          />
        </motion.div>

        {/* Filter chips */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-accent text-bg-deep'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Decisions list */}
        {filteredDecisions.length > 0 ? (
          <div className="space-y-3">
            {filteredDecisions.map((decision, index) => (
              <DecisionCard key={decision.id} decision={decision} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default HistoryPage;
