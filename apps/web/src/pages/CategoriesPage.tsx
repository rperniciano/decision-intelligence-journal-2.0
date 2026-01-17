import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

const EMOJI_OPTIONS = ['📁', '📊', '💼', '🎯', '💡', '🎨', '🚀', '⭐', '🔥', '✨', '🎯', '📌'];
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
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [selectedColor, setSelectedColor] = useState('#00d4aa');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-deep via-bg-dark to-bg-darker">
      {/* Header */}
      <header className="glass-header border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 glass glass-hover rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h1 className="text-xl font-semibold text-text-primary">Manage Categories</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Create Button */}
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="w-full glass glass-hover p-4 rounded-2xl flex items-center justify-center gap-2 mb-6"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5 text-accent" />
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
                <div
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: category.color }}
                />
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
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Category Name
              </label>
              <input
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
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Emoji
              </label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedIcon(emoji)}
                    className={`p-3 rounded-lg text-2xl transition-all duration-200 ${
                      selectedIcon === emoji
                        ? 'bg-accent/20 ring-2 ring-accent'
                        : 'glass glass-hover'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-full aspect-square rounded-lg transition-all duration-200 ${
                      selectedColor === color.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-darker'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 glass glass-hover py-3 rounded-xl text-text-secondary font-medium transition-all duration-200"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || creating}
                className="flex-1 bg-accent text-bg-deep py-3 rounded-xl font-medium hover:bg-accent-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
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
