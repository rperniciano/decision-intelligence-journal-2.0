import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

// Type definitions
interface DecisionOption {
  id: string;
  text: string;
  pros: string[];
  cons: string[];
  isChosen?: boolean;
}

interface Decision {
  id: string;
  title: string;
  status: string;
  category: string;
  emotionalState?: string;
  createdAt: string;
  decidedAt?: string;
  options: DecisionOption[];
  notes?: string;
  transcription?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

export function EditDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<DecisionOption[]>([]);
  const [newOptionText, setNewOptionText] = useState('');

  // Fetch decision data
  useEffect(() => {
    async function fetchDecision() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch decision');
        }

        const data = await response.json();

        setDecision(data);
        setTitle(data.title);
        setNotes(data.notes || '');
        setStatus(data.status);
        setOptions(data.options || []);
      } catch (error) {
        console.error('Error fetching decision:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDecision();
    }
  }, [id, navigate]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) {
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, []);

  const handleAddOption = async () => {
    if (!newOptionText.trim()) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}/options`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newOptionText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add option');
      }

      const newOption = await response.json();

      // Update local state
      setOptions([...options, {
        id: newOption.id,
        text: newOption.title,
        pros: [],
        cons: [],
      }]);
      setNewOptionText('');
    } catch (error) {
      console.error('Error adding option:', error);
    }
  };

  const handleRemoveOption = async (optionId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/options/${optionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete option');
      }

      // Update local state
      setOptions(options.filter(opt => opt.id !== optionId));
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

  const handleUpdateOption = async (optionId: string, newText: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/options/${optionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update option');
      }

      // Update local state
      setOptions(options.map(opt =>
        opt.id === optionId ? { ...opt, text: newText } : opt
      ));
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: notes,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update decision');
      }

      // Navigate back to decision detail page
      navigate(`/decisions/${id}`);
    } catch (error) {
      console.error('Error saving decision:', error);
      // TODO: Show error message to user
    }
  };

  const handleCancel = () => {
    navigate(`/decisions/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
        <div className="grain-overlay" />
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Decision not found</h1>
          <p className="text-text-secondary">The decision you're looking for doesn't exist.</p>
        </div>
        <div className="grain-overlay" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">Edit Decision</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              placeholder="Enter decision title"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            >
              <option value="draft">Draft</option>
              <option value="deliberating">Deliberating</option>
              <option value="decided">Decided</option>
              <option value="abandoned">Abandoned</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
              placeholder="Add notes about your decision"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Options (editable) */}
          <div>
            <label className="block text-sm font-medium mb-2">Options ({options.length})</label>
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                    placeholder="Option name"
                  />
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all"
                    title="Remove option"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add new option */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                  placeholder="Add new option..."
                />
                <button
                  onClick={handleAddOption}
                  className="p-3 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-xl transition-all"
                  title="Add option"
                >
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <motion.button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Save Changes
            </motion.button>
            <motion.button
              onClick={handleCancel}
              className="px-6 py-3 glass glass-hover rounded-full transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default EditDecisionPage;
