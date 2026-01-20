import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SkipLink } from '../components/SkipLink';

// Icons
const ArrowLeft = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Plus = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Edit = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const Trash = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

const EMOJI_OPTIONS = ['📁', '📊', '💼', '🎯', '💡', '🎨', '🚀', '⭐', '🔥', '✨', '📌', '🏷️'];
const COLOR_OPTIONS = [
  { name: 'Teal', value: '#00d4aa' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
];

export function CategoriesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [selectedColor, setSelectedColor] = useState('#00d4aa');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Feature #268: Add AbortController to prevent race conditions during rapid navigation
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          },
          signal, // Feature #268: Pass abort signal
        });
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error: any) {
        // Feature #268: Silently ignore abort errors
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch categories:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Feature #268: Cleanup function - abort fetch on unmount
    return () => {
      abortController.abort();
    };
  }, [session?.access_token]);

  // Feature #268: Separate fetch function for use in handlers (no abort needed for user-triggered actions)
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: selectedIcon,
          color: selectedColor
        })
      });

      if (response.ok) {
        // Reset form and close modal
        setNewCategoryName('');
        setSelectedIcon('📁');
        setSelectedColor('#00d4aa');
        setShowCreateModal(false);

        // Refresh categories
        await fetchCategories();
      } else {
        console.error('Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowEditModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: selectedIcon,
          color: selectedColor
        })
      });

      if (response.ok) {
        // Reset form and close modal
        setEditingCategory(null);
        setNewCategoryName('');
        setSelectedIcon('📁');
        setSelectedColor('#00d4aa');
        setShowEditModal(false);

        // Refresh categories
        await fetchCategories();
      } else {
        console.error('Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        // Refresh categories
        await fetchCategories();
      } else {
        const error = await response.json();
        if (response.status === 400) {
          alert(error.message || 'Cannot delete category with existing decisions');
        } else {
          console.error('Failed to delete category');
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-deep via-bg-dark to-bg-darker">
      <SkipLink />
      {/* Header */}
      <header className="glass-header border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center glass glass-hover rounded-lg transition-all duration-200"
            aria-label="Go back to settings"
          >
            <div className="text-text-secondary" aria-hidden="true">
              <ArrowLeft />
            </div>
          </button>
          <h1 className="text-xl font-semibold text-text-primary">Manage Categories</h1>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-8 max-w-2xl" tabIndex={-1}>
        {/* Create Button */}
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="w-full glass glass-hover p-4 rounded-2xl flex items-center justify-center gap-2 mb-6"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-accent">
            <Plus />
          </div>
          <span className="text-accent font-medium">Create New Category</span>
        </motion.button>

        {/* Categories List */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">
            Your Categories
          </h2>
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading...</div>
          ) : (
            categories.map((category, index) => (
              <motion.div
                key={category.id}
                className="glass p-4 rounded-xl flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-medium text-text-primary">{category.name}</div>
                    <div className="text-xs text-text-secondary">
                      {category.user_id ? 'Custom' : 'System'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.user_id && (
                    <>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center glass glass-hover rounded-lg text-text-secondary hover:text-accent transition-all duration-200"
                        aria-label={`Edit category: ${category.name}`}
                      >
                        <Edit />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center glass glass-hover rounded-lg text-text-secondary hover:text-red-400 transition-all duration-200"
                        aria-label={`Delete category: ${category.name}`}
                      >
                        <Trash />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <motion.div
            className="glass p-6 rounded-2xl max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-text-primary mb-4">Create Category</h2>

            {/* Name Input */}
            <div className="mb-4">
              <label htmlFor="create-category-name" className="block text-sm font-medium text-text-secondary mb-2">
                Category Name
              </label>
              <input
                id="create-category-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Work Projects"
                className="w-full glass p-3 rounded-xl text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                autoFocus
              />
            </div>

            {/* Icon Selection */}
            <div className="mb-4">
              <span id="create-emoji-label" className="block text-sm font-medium text-text-secondary mb-2">
                Select Emoji
              </span>
              <div className="grid grid-cols-6 gap-2" role="group" aria-labelledby="create-emoji-label">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedIcon(emoji)}
                    className={`min-h-[44px] flex items-center justify-center rounded-lg text-2xl transition-all duration-200 ${
                      selectedIcon === emoji
                        ? 'bg-accent/20 ring-2 ring-accent'
                        : 'glass glass-hover'
                    }`}
                    aria-label={`Select ${emoji} emoji`}
                    aria-pressed={selectedIcon === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <span id="create-color-label" className="block text-sm font-medium text-text-secondary mb-2">
                Select Color
              </span>
              <div className="grid grid-cols-6 gap-2" role="group" aria-labelledby="create-color-label">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`min-h-[44px] rounded-lg transition-all duration-200 ${
                      selectedColor === color.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-darker'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                    aria-pressed={selectedColor === color.value}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 glass glass-hover min-h-[44px] rounded-xl text-text-secondary font-medium transition-all duration-200"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || creating}
                className="flex-1 bg-accent text-bg-deep min-h-[44px] rounded-xl font-medium hover:bg-accent-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <motion.div
            className="glass p-6 rounded-2xl max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-text-primary mb-4">Edit Category</h2>

            {/* Name Input */}
            <div className="mb-4">
              <label htmlFor="edit-category-name" className="block text-sm font-medium text-text-secondary mb-2">
                Category Name
              </label>
              <input
                id="edit-category-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Work Projects"
                className="w-full glass p-3 rounded-xl text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                autoFocus
              />
            </div>

            {/* Icon Selection */}
            <div className="mb-4">
              <span id="edit-emoji-label" className="block text-sm font-medium text-text-secondary mb-2">
                Select Emoji
              </span>
              <div className="grid grid-cols-6 gap-2" role="group" aria-labelledby="edit-emoji-label">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedIcon(emoji)}
                    className={`min-h-[44px] flex items-center justify-center rounded-lg text-2xl transition-all duration-200 ${
                      selectedIcon === emoji
                        ? 'bg-accent/20 ring-2 ring-accent'
                        : 'glass glass-hover'
                    }`}
                    aria-label={`Select ${emoji} emoji`}
                    aria-pressed={selectedIcon === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <span id="edit-color-label" className="block text-sm font-medium text-text-secondary mb-2">
                Select Color
              </span>
              <div className="grid grid-cols-6 gap-2" role="group" aria-labelledby="edit-color-label">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`min-h-[44px] rounded-lg transition-all duration-200 ${
                      selectedColor === color.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-darker'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                    aria-pressed={selectedColor === color.value}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                  setSelectedIcon('📁');
                  setSelectedColor('#00d4aa');
                }}
                className="flex-1 glass glass-hover min-h-[44px] rounded-xl text-text-secondary font-medium transition-all duration-200"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={!newCategoryName.trim() || updating}
                className="flex-1 bg-accent text-bg-deep min-h-[44px] rounded-xl font-medium hover:bg-accent-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}
