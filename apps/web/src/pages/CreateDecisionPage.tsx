import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

interface Option {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
}

const EMOTIONAL_STATES = [
  'confident',
  'anxious',
  'excited',
  'uncertain',
  'calm',
  'stressed',
  'optimistic',
  'overwhelmed'
];

export function CreateDecisionPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('decided');
  const [categoryId, setCategoryId] = useState<string>('');
  const [emotionalState, setEmotionalState] = useState<string>('');
  const [options, setOptions] = useState<Option[]>([]);

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

  const addOption = () => {
    setOptions([
      ...options,
      {
        id: `temp-${Date.now()}`,
        title: '',
        pros: [],
        cons: []
      }
    ]);
  };

  const updateOption = (id: string, field: 'title', value: string) => {
    setOptions(options.map(opt =>
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const removeOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const addProCon = (optionId: string, type: 'pros' | 'cons', value: string) => {
    if (!value.trim()) return;

    setOptions(options.map(opt => {
      if (opt.id === optionId) {
        return {
          ...opt,
          [type]: [...opt[type], value]
        };
      }
      return opt;
    }));
  };

  const removeProCon = (optionId: string, type: 'pros' | 'cons', index: number) => {
    setOptions(options.map(opt => {
      if (opt.id === optionId) {
        return {
          ...opt,
          [type]: opt[type].filter((_, i) => i !== index)
        };
      }
      return opt;
    }));
  };

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        setError('Please enter a decision title');
        return;
      }

      setSaving(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      // Get category name from ID
      let categoryName = 'Uncategorized';
      if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          categoryName = category.name;
        }
      }

      // Create decision
      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          notes,
          status,
          category: categoryName,
          emotional_state: emotionalState || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create decision');
      }

      const decision = await response.json();

      // Create options if any
      if (options.length > 0) {
        for (const option of options) {
          if (!option.title.trim()) continue;

          const optionResponse = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${decision.id}/options`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: option.title,
            }),
          });

          if (!optionResponse.ok) {
            console.error('Failed to create option:', option.title);
            continue;
          }

          const createdOption = await optionResponse.json();

          // Create pros and cons
          for (const pro of option.pros) {
            await fetch(`${import.meta.env.VITE_API_URL}/options/${createdOption.id}/pros-cons`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'pro',
                content: pro,
              }),
            });
          }

          for (const con of option.cons) {
            await fetch(`${import.meta.env.VITE_API_URL}/options/${createdOption.id}/pros-cons`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'con',
                content: con,
              }),
            });
          }
        }
      }

      // Navigate to the created decision
      navigate(`/decisions/${decision.id}`);
    } catch (error) {
      console.error('Error saving decision:', error);
      setError('Failed to save decision. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">Create Decision</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="decision-title" className="block text-sm font-medium mb-2">Title *</label>
            <input
              id="decision-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              placeholder="What decision are you making?"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="decision-category" className="block text-sm font-medium mb-2">Category</label>
            <select
              id="decision-category"
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

          {/* Emotional State */}
          <div>
            <label htmlFor="decision-emotional-state" className="block text-sm font-medium mb-2">How are you feeling?</label>
            <select
              id="decision-emotional-state"
              value={emotionalState}
              onChange={(e) => setEmotionalState(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            >
              <option value="">Select emotional state</option>
              {EMOTIONAL_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="decision-status" className="block text-sm font-medium mb-2">Status</label>
            <select
              id="decision-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="decided">Decided</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Options</label>
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-accent hover:text-accent-400 transition-colors"
              >
                + Add Option
              </button>
            </div>

            {options.length === 0 ? (
              <div className="px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-center text-text-secondary">
                No options added yet. Click "+ Add Option" to add one.
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <div className="flex gap-2">
                      <label htmlFor={`option-title-${option.id}`} className="sr-only">Option {index + 1} title</label>
                      <input
                        id={`option-title-${option.id}`}
                        type="text"
                        value={option.title}
                        onChange={(e) => updateOption(option.id, 'title', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(option.id)}
                        className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label htmlFor={`add-pro-${option.id}`} className="text-green-400 mb-1 block">Pros</label>
                        {option.pros.map((pro, proIndex) => (
                          <div key={proIndex} className="flex items-center gap-1 mb-1">
                            <span className="flex-1 text-text-secondary">• {pro}</span>
                            <button
                              type="button"
                              onClick={() => removeProCon(option.id, 'pros', proIndex)}
                              className="text-xs text-red-400 hover:text-red-300"
                              aria-label={`Remove pro: ${pro}`}
                            >
                              <span aria-hidden="true">×</span>
                            </button>
                          </div>
                        ))}
                        <input
                          id={`add-pro-${option.id}`}
                          type="text"
                          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-xs"
                          placeholder="Add a pro..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              addProCon(option.id, 'pros', input.value);
                              input.value = '';
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor={`add-con-${option.id}`} className="text-red-400 mb-1 block">Cons</label>
                        {option.cons.map((con, conIndex) => (
                          <div key={conIndex} className="flex items-center gap-1 mb-1">
                            <span className="flex-1 text-text-secondary">• {con}</span>
                            <button
                              type="button"
                              onClick={() => removeProCon(option.id, 'cons', conIndex)}
                              className="text-xs text-red-400 hover:text-red-300"
                              aria-label={`Remove con: ${con}`}
                            >
                              <span aria-hidden="true">×</span>
                            </button>
                          </div>
                        ))}
                        <input
                          id={`add-con-${option.id}`}
                          type="text"
                          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-xs"
                          placeholder="Add a con..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              addProCon(option.id, 'cons', input.value);
                              input.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="decision-notes" className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              id="decision-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
              placeholder="Add any additional notes about your decision"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? 'Saving...' : 'Save Decision'}
            </motion.button>
            <motion.button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 glass glass-hover rounded-full transition-all disabled:opacity-50"
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
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

export default CreateDecisionPage;
