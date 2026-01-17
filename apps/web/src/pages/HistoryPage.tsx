import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { supabase } from '../lib/supabase';

// Type definitions
interface Decision {
  id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'decided' | 'abandoned';
  category: string;
  categoryId?: string;
  emotionalState?: string;
  createdAt: string;
  decidedAt?: string;
  chosenOption?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

// Status badge component
function StatusBadge({ status }: { status: Decision['status'] }) {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-white/10 text-text-secondary' },
    in_progress: { label: 'In Progress', className: 'bg-amber-500/20 text-amber-400' },
    decided: { label: 'Decided', className: 'bg-accent/20 text-accent' },
    abandoned: { label: 'Abandoned', className: 'bg-white/5 text-text-secondary' },
  };

  const config = statusConfig[status] || { label: status || 'Unknown', className: 'bg-white/10 text-text-secondary' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Decision card component
function DecisionCard({
  decision,
  index,
  isSelected,
  onToggleSelect
}: {
  decision: Decision;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
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
      className="relative"
    >
      <div className="glass p-4 rounded-xl rim-light hover:bg-white/[0.03] transition-colors">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(decision.id)}
            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Decision content (clickable to navigate) */}
          <Link to={`/decisions/${decision.id}`} className="flex-1 min-w-0">
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
          </Link>
        </div>
      </div>
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
  { id: 'in_progress', label: 'In Progress' },
  { id: 'decided', label: 'Decided' },
  { id: 'trash', label: 'Trash' },
];

const ITEMS_PER_PAGE = 10;

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const filterFromUrl = searchParams.get('filter') || 'all';
  const categoryFromUrl = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(filterFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Update activeFilter and selectedCategory when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setActiveFilter(filterFromUrl);
    setSelectedCategory(categoryFromUrl);
  }, [filterFromUrl, categoryFromUrl]);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, []);

  // Fetch decisions from API
  useEffect(() => {
    async function fetchDecisions() {
      try {
        setLoading(true);

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) {
          setDecisions([]);
          return;
        }

        // Use trash endpoint if trash filter is active, otherwise regular endpoint
        const baseUrl = import.meta.env.VITE_API_URL;
        const endpoint = activeFilter === 'trash'
          ? `${baseUrl}/decisions/trash`
          : `${baseUrl}/decisions`;

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch decisions');
        }

        const data = await response.json();

        // Transform API response to match component interface
        const transformedDecisions = data.decisions.map((d: any) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          category: d.category,
          categoryId: d.category_id,
          emotionalState: d.emotional_state,
          createdAt: d.created_at,
          decidedAt: d.decided_at,
          chosenOption: d.options?.find((opt: any) => opt.isChosen)?.text,
        }));

        setDecisions(transformedDecisions);
      } catch (error) {
        console.error('Error fetching decisions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDecisions();
  }, [activeFilter]);

  // Filter decisions based on search, status filter, and category
  const filteredDecisions = decisions.filter((decision) => {
    const matchesSearch = decision.title.toLowerCase().includes(searchQuery.toLowerCase());
    // When viewing trash, show all deleted items regardless of status
    // Otherwise, apply status filter
    const matchesFilter = activeFilter === 'trash' || activeFilter === 'all' || decision.status === activeFilter;
    // Category filter
    const matchesCategory = selectedCategory === 'all' || decision.categoryId === selectedCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDecisions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDecisions = filteredDecisions.slice(startIndex, endIndex);

  // Handle page change
  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle decision selection
  const toggleDecisionSelection = (decisionId: string) => {
    setSelectedDecisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(decisionId)) {
        newSet.delete(decisionId);
      } else {
        newSet.add(decisionId);
      }
      return newSet;
    });
  };

  // Select all decisions on current page
  const selectAllOnPage = () => {
    setSelectedDecisions(prev => {
      const newSet = new Set(prev);
      paginatedDecisions.forEach(d => newSet.add(d.id));
      return newSet;
    });
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedDecisions(new Set());
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedDecisions.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedDecisions.size} decision${selectedDecisions.size > 1 ? 's' : ''}? Type "DELETE ${selectedDecisions.size}" to confirm.`;
    const userInput = prompt(confirmMessage);

    if (userInput !== `DELETE ${selectedDecisions.size}`) {
      return;
    }

    setIsDeleting(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionIds: Array.from(selectedDecisions)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete decisions');
      }

      const result = await response.json();

      // Refresh decisions list
      setDecisions(prev => prev.filter(d => !selectedDecisions.has(d.id)));
      setSelectedDecisions(new Set());

      alert(`Successfully deleted ${result.deletedCount} decision${result.deletedCount > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error deleting decisions:', error);
      alert('Failed to delete decisions. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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
          className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('filter', filter.id);
                newParams.set('page', '1'); // Reset to page 1 when filter changes
                setSearchParams(newParams);
              }}
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

        {/* Category filter */}
        {categories.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm text-text-secondary mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('category', e.target.value);
                newParams.set('page', '1');
                setSearchParams(newParams);
              }}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Bulk action toolbar */}
        {selectedDecisions.size > 0 && (
          <motion.div
            className="mb-4 p-4 glass rounded-xl rim-light flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-sm text-text-primary">
              {selectedDecisions.size} decision{selectedDecisions.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={deselectAll}
                className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Select all button */}
        {filteredDecisions.length > 0 && (
          <motion.div
            className="mb-3 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={selectAllOnPage}
              className="text-xs text-accent hover:text-accent-400 transition-colors"
            >
              Select all on page
            </button>
          </motion.div>
        )}

        {/* Decisions list */}
        {filteredDecisions.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginatedDecisions.map((decision, index) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  index={index}
                  isSelected={selectedDecisions.has(decision.id)}
                  onToggleSelect={toggleDecisionSelection}
                />
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg bg-white/5 text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-accent text-bg-deep'
                          : 'bg-white/5 text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg bg-white/5 text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton to="/record" ariaLabel="Quick record decision" />

      {/* Bottom navigation */}
      <BottomNav />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default HistoryPage;
