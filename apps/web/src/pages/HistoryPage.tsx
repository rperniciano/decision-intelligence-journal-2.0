import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { SkipLink } from '../components/SkipLink';
import { supabase } from '../lib/supabase';
import { showErrorAlert } from '../utils/errorHandling';

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
  decideByDate?: string;
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

// Check if a decision is overdue (timezone-aware)
function isOverdue(decideByDate: string | undefined, status: Decision['status']): boolean {
  // Only mark as overdue if:
  // 1. There is a decide_by_date
  // 2. The status is NOT 'decided' or 'abandoned' (already resolved)
  // 3. The decide_by_date is in the past (compared to user's local timezone)
  if (!decideByDate || status === 'decided' || status === 'abandoned') {
    return false;
  }

  // Parse the decide_by_date (YYYY-MM-DD format) and compare to today in user's timezone
  const decideBy = new Date(decideByDate);
  const today = new Date();

  // Set both to midnight for date-only comparison
  today.setHours(0, 0, 0, 0);
  decideBy.setHours(0, 0, 0, 0);

  return decideBy < today;
}

// Overdue badge component
function OverdueBadge() {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400"
      role="status"
      aria-label="Overdue"
    >
      Overdue
    </span>
  );
}

// Decision card component
function DecisionCard({
  decision,
  index,
  isSelected,
  onToggleSelect,
  activeFilter,
  onRestore
}: {
  decision: Decision;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  activeFilter?: string;
  onRestore?: (id: string) => void;
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
          {/* Checkbox with 44px touch target */}
          <label className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer -m-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(decision.id)}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </label>

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
                <div className="flex items-center gap-1">
                  <StatusBadge status={decision.status} />
                  {isOverdue(decision.decideByDate, decision.status) && <OverdueBadge />}
                </div>
                <span className="text-xs text-text-secondary">{formatDate(decision.createdAt)}</span>
                {/* Show restore button when viewing trash */}
                {activeFilter === 'trash' && onRestore && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRestore(decision.id);
                    }}
                    className="mt-2 px-3 py-1 text-xs bg-accent/20 text-accent hover:bg-accent/30 rounded-lg transition-colors"
                    aria-label="Restore decision"
                  >
                    Restore
                  </button>
                )}
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
function EmptyState({ searchQuery }: { searchQuery?: string }) {
  const isSearching = searchQuery && searchQuery.trim().length > 0;

  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
        {isSearching ? (
          <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-medium mb-2">
        {isSearching ? 'No results found' : 'No decisions yet'}
      </h3>
      <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">
        {isSearching
          ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
          : 'Start recording your decisions to build your history. Each decision becomes part of your journey.'}
      </p>
      {!isSearching && (
        <Link to="/record">
          <motion.button
            className="px-6 min-h-[44px] bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Record Your First Decision
          </motion.button>
        </Link>
      )}
    </motion.div>
  );
}

// Timeline view component - groups decisions by month/year
function TimelineView({
  decisions,
  selectedDecisions,
  onToggleSelect,
  activeFilter,
  onRestore
}: {
  decisions: Decision[];
  selectedDecisions: Set<string>;
  onToggleSelect: (id: string) => void;
  activeFilter?: string;
  onRestore?: (id: string) => void;
}) {
  // Group decisions by month/year (e.g., "January 2026", "December 2025")
  const groupDecisions = () => {
    const groups: { [key: string]: Decision[] } = {};

    decisions.forEach((decision) => {
      const date = new Date(decision.createdAt);
      // Create month/year key (e.g., "January 2026")
      const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(decision);
    });

    // Sort groups by date (newest first) and convert to array
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      // Parse dates from group names to sort chronologically
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    return sortedGroups;
  };

  const groupedDecisions = groupDecisions();

  return (
    <div className="space-y-8">
      {groupedDecisions.map(([groupName, groupDecisions]) => (
        <div key={groupName}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <h2 className="text-lg font-medium text-text-primary">{groupName}</h2>
            <span className="text-sm text-text-secondary">({groupDecisions.length})</span>
          </div>
          <div className="border-l-2 border-white/10 ml-[5px] pl-6 space-y-3">
            {groupDecisions.map((decision, index) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                index={index}
                isSelected={selectedDecisions.has(decision.id)}
                onToggleSelect={onToggleSelect}
                activeFilter={activeFilter}
                onRestore={onRestore}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Calendar view component - shows a heatmap-style calendar
function CalendarView({
  decisions,
}: {
  decisions: Decision[];
}) {
  // Get the current month's days
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Count decisions per day
  const decisionsByDay: { [day: number]: Decision[] } = {};
  decisions.forEach((decision) => {
    const date = new Date(decision.createdAt);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (!decisionsByDay[day]) {
        decisionsByDay[day] = [];
      }
      decisionsByDay[day].push(decision);
    }
  });

  // Get intensity class based on number of decisions
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count === 1) return 'bg-accent/20';
    if (count === 2) return 'bg-accent/40';
    if (count <= 4) return 'bg-accent/60';
    return 'bg-accent/80';
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Generate calendar grid
  const calendarDays = [];
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="glass p-6 rounded-xl rim-light">
      <h2 className="text-lg font-medium text-text-primary mb-4">
        {monthNames[month]} {year}
      </h2>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-text-secondary font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const count = decisionsByDay[day]?.length || 0;
          const isToday = day === now.getDate();

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-default
                ${getIntensityClass(count)}
                ${isToday ? 'ring-2 ring-accent' : ''}
              `}
              title={`${count} decision${count !== 1 ? 's' : ''} on ${monthNames[month]} ${day}`}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-accent' : 'text-text-primary'}`}>
                {day}
              </span>
              {count > 0 && (
                <span className="text-xs text-text-secondary">{count}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-text-secondary">Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-4 h-4 rounded-sm ${getIntensityClass(level)}`}
            />
          ))}
        </div>
        <span className="text-xs text-text-secondary">More</span>
      </div>
    </div>
  );
}

// Time-based filter options
const timeFilterOptions = [
  { id: 'all_time', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
];

// Filter chips
const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'decided', label: 'Decided' },
  { id: 'trash', label: 'Trash' },
];

// View options
const viewOptions = [
  { id: 'list', label: 'List', icon: 'list' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
] as const;

type ViewType = typeof viewOptions[number]['id'];

// Sort options that make sense per view
const viewDefaultSorts: Record<ViewType, string> = {
  list: 'date_desc',
  timeline: 'date_desc', // Timeline always shows chronologically
  calendar: 'date_desc', // Calendar shows by date
};

const ITEMS_PER_PAGE = 10;

// Helper function to check if a date is today in user's local timezone
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// Helper function to check if a date is within this week (last 7 days) in user's local timezone
function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  return date >= weekAgo;
}

// Helper function to check if a date is within this month in user's local timezone
function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
}

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const filterFromUrl = searchParams.get('filter') || 'all';
  const categoryFromUrl = searchParams.get('category') || 'all';
  const sortFromUrl = searchParams.get('sort') || 'date_desc';
  const viewFromUrl = (searchParams.get('view') || 'list') as ViewType;
  const timeFilterFromUrl = searchParams.get('time') || 'all_time';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(filterFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [sortBy, setSortBy] = useState(sortFromUrl);
  const [activeView, setActiveView] = useState<ViewType>(viewFromUrl);
  const [timeFilter, setTimeFilter] = useState(timeFilterFromUrl);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);

  // Feature #267: Cursor-based pagination state
  const [pageCursors, setPageCursors] = useState<Map<number, string>>(new Map()); // page -> cursor
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Update activeFilter, selectedCategory, sortBy, activeView, and timeFilter when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setActiveFilter(filterFromUrl);
    setSelectedCategory(categoryFromUrl);
    setSortBy(sortFromUrl);
    setActiveView(viewFromUrl);
    setTimeFilter(timeFilterFromUrl);

    // Feature #267: Reset pageCursors when filters change
    setPageCursors(new Map());
    setNextCursor(null);
  }, [filterFromUrl, categoryFromUrl, sortFromUrl, viewFromUrl, timeFilterFromUrl]);

  // Feature #279: Store filter state in sessionStorage for export page
  useEffect(() => {
    const filterState = {
      filter: activeFilter,
      category: selectedCategory,
      time: timeFilter,
      search: searchQuery,
    };
    sessionStorage.setItem('exportFilters', JSON.stringify(filterState));
  }, [activeFilter, selectedCategory, timeFilter, searchQuery]);

  // Fetch categories on mount
  // Feature #268: Add AbortController to prevent race conditions
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function fetchCategories() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal, // Feature #268: Pass abort signal
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error: any) {
        // Feature #268: Silently ignore abort errors
        if (error.name !== 'AbortError') {
          console.error('Error fetching categories:', error);
        }
        // Silently fail for categories as it's not critical for viewing decisions
      }
    }

    fetchCategories();

    // Feature #268: Cleanup function
    return () => {
      abortController.abort();
    };
  }, []);

  // Fetch decisions from API
  // Feature #268: Add AbortController to prevent race conditions during rapid navigation
  useEffect(() => {
    // Create abort controller for this effect
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function fetchDecisions() {
      try {
        setLoading(true);

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) {
          setDecisions([]);
          return;
        }

        // Build query parameters
        const params = new URLSearchParams();

        // Add status filter (but not for trash - trash is a separate endpoint)
        if (activeFilter !== 'all' && activeFilter !== 'trash') {
          params.append('status', activeFilter);
        }

        // Add category filter
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }

        // Add search query
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        // Add sort parameter
        params.append('sort', sortBy);

        // Add pagination parameters
        const itemsPerPage = ITEMS_PER_PAGE;

        // Feature #267: Use cursor-based pagination for page > 1
        // For page 1, no cursor needed
        // For page > 1, get the cursor from our stored pageCursors
        if (currentPage === 1) {
          // First page - no cursor needed
          params.append('limit', itemsPerPage.toString());
        } else {
          // Get cursor for the previous page
          const cursorForPage = pageCursors.get(currentPage - 1);
          if (cursorForPage) {
            params.append('cursor', cursorForPage);
            params.append('limit', itemsPerPage.toString());
          } else {
            // Fallback to offset if cursor not available (shouldn't happen)
            const offset = (currentPage - 1) * itemsPerPage;
            params.append('offset', offset.toString());
            params.append('limit', itemsPerPage.toString());
          }
        }

        // Use trash endpoint if trash filter is active, otherwise regular endpoint
        const baseUrl = import.meta.env.VITE_API_URL;
        const endpoint = activeFilter === 'trash'
          ? `${baseUrl}/decisions/trash`
          : `${baseUrl}/decisions`;

        // Append query parameters to URL
        const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal, // Feature #268: Pass abort signal to fetch
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
          decideByDate: d.decide_by_date,
          chosenOption: d.options?.find((opt: any) => opt.isChosen)?.text,
        }));

        setDecisions(transformedDecisions);
        setTotalCount(data.total || 0);

        // Feature #267: Store cursor for this page
        // Also invalidate cursors for subsequent pages if current page changes
        if (data.nextCursor) {
          setPageCursors(prev => {
            const newMap = new Map(prev);
            const existingCursor = prev.get(currentPage);

            // If cursor for this page has changed, invalidate all subsequent cursors
            if (existingCursor !== data.nextCursor) {
              // Remove all cursors for pages > current page
              for (const [key] of prev) {
                if (key > currentPage) {
                  newMap.delete(key);
                }
              }
            }

            newMap.set(currentPage, data.nextCursor);
            return newMap;
          });
        }
        setNextCursor(data.nextCursor || null);
        setHasMore(data.hasMore || false);
      } catch (error: any) {
        // Feature #268: Don't show error if request was aborted (user navigated away)
        if (error.name !== 'AbortError') {
          console.error('Error fetching decisions:', error);
          showErrorAlert(error, 'Failed to load decisions');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDecisions();

    // Feature #268: Cleanup function - abort fetch on component unmount or dependency change
    return () => {
      abortController.abort();
    };
  }, [activeFilter, selectedCategory, searchQuery, sortBy, currentPage]);

  // Apply time-based filtering client-side (to respect user's timezone)
  const timeFilteredDecisions = decisions.filter((decision) => {
    if (timeFilter === 'all_time') return true;
    if (timeFilter === 'today') return isToday(decision.createdAt);
    if (timeFilter === 'this_week') return isThisWeek(decision.createdAt);
    if (timeFilter === 'this_month') return isThisMonth(decision.createdAt);
    return true;
  });

  // Use time-filtered decisions for display
  const paginatedDecisions = timeFilteredDecisions;

  // Pagination calculations using filtered count for time filter
  // Note: When time filter is applied, we use client-side count
  const effectiveCount = timeFilter === 'all_time' ? totalCount : timeFilteredDecisions.length;
  const totalPages = Math.ceil(effectiveCount / ITEMS_PER_PAGE);

  // Handle page change
  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle view change - resets sort to view-appropriate default
  const handleViewChange = (newView: ViewType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', newView);
    newParams.set('page', '1'); // Reset to page 1 when view changes

    // Reset sort to the default sort for the new view
    const newSort = viewDefaultSorts[newView];
    newParams.set('sort', newSort);

    setSearchParams(newParams);
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

  // Bulk restore handler
  const handleBulkRestore = async () => {
    if (selectedDecisions.size === 0) return;

    const confirmMessage = `Are you sure you want to restore ${selectedDecisions.size} decision${selectedDecisions.size > 1 ? 's' : ''}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsRestoring(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/bulk-restore`, {
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
        throw new Error('Failed to restore decisions');
      }

      const result = await response.json();

      // Remove restored decisions from trash list
      setDecisions(prev => prev.filter(d => !selectedDecisions.has(d.id)));
      setSelectedDecisions(new Set());

      alert(`Successfully restored ${result.restoredCount} decision${result.restoredCount > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error restoring decisions:', error);
      alert('Failed to restore decisions. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Bulk permanent delete handler
  const handleBulkPermanentDelete = async () => {
    if (selectedDecisions.size === 0) return;

    const confirmMessage = `⚠️ PERMANENT DELETE ⚠️\n\nThis will PERMANENTLY delete ${selectedDecisions.size} decision${selectedDecisions.size > 1 ? 's' : ''} from the database. This action CANNOT be undone.\n\nType "DELETE ${selectedDecisions.size}" to confirm.`;
    const userInput = prompt(confirmMessage);

    if (userInput !== `DELETE ${selectedDecisions.size}`) {
      return;
    }

    setIsPermanentlyDeleting(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/bulk-permanent-delete`, {
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
        throw new Error('Failed to permanently delete decisions');
      }

      const result = await response.json();

      // Remove permanently deleted decisions from trash list
      setDecisions(prev => prev.filter(d => !selectedDecisions.has(d.id)));
      setSelectedDecisions(new Set());

      alert(`Permanently deleted ${result.deletedCount} decision${result.deletedCount > 1 ? 's' : ''}. This action cannot be undone.`);
    } catch (error) {
      console.error('Error permanently deleting decisions:', error);
      alert('Failed to permanently delete decisions. Please try again.');
    } finally {
      setIsPermanentlyDeleting(false);
    }
  };

  // Single decision restore handler
  const handleSingleRestore = async (decisionId: string) => {
    if (!window.confirm('Restore this decision?')) {
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${decisionId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to restore decision');
      }

      const result = await response.json();

      // Remove restored decision from trash list
      setDecisions(prev => prev.filter(d => d.id !== decisionId));

      alert('Decision restored successfully');
    } catch (error) {
      console.error('Error restoring decision:', error);
      alert('Failed to restore decision. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <SkipLink />
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
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-4" tabIndex={-1}>
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
            aria-hidden="true"
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

        {/* Active filter chips - Feature #198 */}
        {(activeFilter !== 'all' || selectedCategory !== 'all' || timeFilter !== 'all_time' || searchQuery.trim()) && (
          <motion.div
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            {/* Status filter chip */}
            {activeFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/20 text-accent rounded-full text-sm">
                <span>{filterOptions.find(f => f.id === activeFilter)?.label || activeFilter}</span>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('filter', 'all');
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="ml-1 hover:bg-accent/30 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${activeFilter} filter`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Category filter chip */}
            {selectedCategory !== 'all' && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/20 text-accent rounded-full text-sm">
                <span>{categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('category');
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="ml-1 hover:bg-accent/30 rounded-full p-0.5 transition-colors"
                  aria-label="Remove category filter"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Time filter chip */}
            {timeFilter !== 'all_time' && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/20 text-accent rounded-full text-sm">
                <span>{timeFilterOptions.find(t => t.id === timeFilter)?.label || timeFilter}</span>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('time');
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="ml-1 hover:bg-accent/30 rounded-full p-0.5 transition-colors"
                  aria-label="Remove time filter"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Search query chip */}
            {searchQuery.trim() && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/20 text-accent rounded-full text-sm">
                <span>Search: "{searchQuery}"</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="ml-1 hover:bg-accent/30 rounded-full p-0.5 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Clear all filters button */}
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('filter');
                newParams.delete('category');
                newParams.delete('time');
                newParams.set('page', '1');
                setSearchParams(newParams);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 bg-white/10 text-text-secondary rounded-full text-sm hover:bg-white/20 transition-colors"
            >
              Clear all
            </button>
          </motion.div>
        )}

        {/* Filter and View row */}
        <motion.div
          className="flex items-center justify-between gap-4 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('filter', filter.id);
                  newParams.set('page', '1'); // Reset to page 1 when filter changes
                  setSearchParams(newParams);
                }}
                className={`px-4 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-accent text-bg-deep'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* View switcher */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1" role="tablist" aria-label="View options">
            {viewOptions.map((view) => (
              <button
                key={view.id}
                onClick={() => handleViewChange(view.id)}
                className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-all ${
                  activeView === view.id
                    ? 'bg-accent text-bg-deep'
                    : 'text-text-secondary hover:bg-white/10'
                }`}
                role="tab"
                aria-selected={activeView === view.id}
                aria-label={`${view.label} view`}
              >
                {view.icon === 'list' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                )}
                {view.icon === 'timeline' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {view.icon === 'calendar' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Time filter */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <label htmlFor="time-filter" className="block text-sm text-text-secondary mb-2">Time Period</label>
          <select
            id="time-filter"
            value={timeFilter}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('time', e.target.value);
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
          >
            {timeFilterOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Category filter */}
        {categories.length > 0 && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="category-filter" className="block text-sm text-text-secondary mb-2">Category</label>
            <select
              id="category-filter"
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

        {/* Sort order - only visible in List view (Timeline/Calendar have fixed chronological order) */}
        {activeView === 'list' && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label htmlFor="sort-filter" className="block text-sm text-text-secondary mb-2">Sort by</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sort', e.target.value);
                newParams.set('page', '1');
                setSearchParams(newParams);
              }}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
              <option value="category_asc">Category (A-Z)</option>
              <option value="category_desc">Category (Z-A)</option>
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
              {activeFilter === 'trash' ? (
                <>
                  <button
                    onClick={handleBulkRestore}
                    disabled={isRestoring || isPermanentlyDeleting}
                    className="px-4 py-2 text-sm bg-accent/20 text-accent hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRestoring ? 'Restoring...' : 'Restore Selected'}
                  </button>
                  <button
                    onClick={handleBulkPermanentDelete}
                    disabled={isPermanentlyDeleting || isRestoring}
                    className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPermanentlyDeleting ? 'Deleting...' : 'Permanent Delete'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Select all button - only for List and Timeline views (Calendar doesn't support selection) */}
        {decisions.length > 0 && activeView !== 'calendar' && (
          <motion.div
            className="mb-3 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={selectAllOnPage}
              className="text-xs text-accent hover:text-accent-400 transition-colors min-h-[44px] px-3 flex items-center"
            >
              Select all on page
            </button>
          </motion.div>
        )}

        {/* Decisions view */}
        {decisions.length > 0 ? (
          <>
            {/* List View */}
            {activeView === 'list' && (
              <>
                <div className="space-y-3">
                  {paginatedDecisions.map((decision, index) => (
                    <DecisionCard
                      key={decision.id}
                      decision={decision}
                      index={index}
                      isSelected={selectedDecisions.has(decision.id)}
                      onToggleSelect={toggleDecisionSelection}
                      activeFilter={activeFilter}
                      onRestore={handleSingleRestore}
                    />
                  ))}
                </div>

                {/* Pagination controls - only for list view */}
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
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/5 text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                      aria-label="Go to previous page"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg font-medium transition-all ${
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
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/5 text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                      aria-label="Go to next page"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </motion.div>
                )}
              </>
            )}

            {/* Timeline View */}
            {activeView === 'timeline' && (
              <TimelineView
                decisions={paginatedDecisions}
                selectedDecisions={selectedDecisions}
                onToggleSelect={toggleDecisionSelection}
                activeFilter={activeFilter}
                onRestore={handleSingleRestore}
              />
            )}

            {/* Calendar View */}
            {activeView === 'calendar' && (
              <CalendarView decisions={decisions} />
            )}
          </>
        ) : (
          <EmptyState searchQuery={searchQuery} />
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
