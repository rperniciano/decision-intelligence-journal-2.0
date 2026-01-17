import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

// Type definitions
interface ProCon {
  id: string;
  content: string;
  type: 'pro' | 'con';
}

interface DecisionOption {
  id: string;
  text: string;
  pros: ProCon[];
  cons: ProCon[];
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
  const [newProInputs, setNewProInputs] = useState<Record<string, string>>({});
  const [newConInputs, setNewConInputs] = useState<Record<string, string>>({});

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

  const handleAddPro = async (optionId: string, text: string) => {
    if (!text.trim()) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/options/${optionId}/pros-cons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'pro',
          content: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add pro');
      }

      const newPro = await response.json();

      // Update local state
      setOptions(options.map(opt =>
        opt.id === optionId
          ? { ...opt, pros: [...opt.pros, { id: newPro.id, content: newPro.content, type: 'pro' }] }
          : opt
      ));

      // Clear input
      setNewProInputs({ ...newProInputs, [optionId]: '' });
    } catch (error) {
      console.error('Error adding pro:', error);
    }
  };

  const handleAddCon = async (optionId: string, text: string) => {
    if (!text.trim()) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/options/${optionId}/pros-cons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'con',
          content: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add con');
      }

      const newCon = await response.json();

      // Update local state
      setOptions(options.map(opt =>
        opt.id === optionId
          ? { ...opt, cons: [...opt.cons, { id: newCon.id, content: newCon.content, type: 'con' }] }
          : opt
      ));

      // Clear input
      setNewConInputs({ ...newConInputs, [optionId]: '' });
    } catch (error) {
      console.error('Error adding con:', error);
    }
  };

  const handleUpdateProCon = async (id: string, newText: string, optionId: string, type: 'pro' | 'con', index: number) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/pros-cons/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pro/con');
      }

      // Update local state
      setOptions(options.map(opt => {
        if (opt.id === optionId) {
          if (type === 'pro') {
            const newPros = [...opt.pros];
            newPros[index] = { ...newPros[index], content: newText };
            return { ...opt, pros: newPros };
          } else {
            const newCons = [...opt.cons];
            newCons[index] = { ...newCons[index], content: newText };
            return { ...opt, cons: newCons };
          }
        }
        return opt;
      }));
    } catch (error) {
      console.error('Error updating pro/con:', error);
    }
  };

  const handleDeleteProCon = async (id: string, optionId: string, type: 'pro' | 'con', index: number) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/pros-cons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete pro/con');
      }

      // Update local state
      setOptions(options.map(opt => {
        if (opt.id === optionId) {
          if (type === 'pro') {
            const newPros = opt.pros.filter((_, i) => i !== index);
            return { ...opt, pros: newPros };
          } else {
            const newCons = opt.cons.filter((_, i) => i !== index);
            return { ...opt, cons: newCons };
          }
        }
        return opt;
      }));
    } catch (error) {
      console.error('Error deleting pro/con:', error);
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
              <option value="in_progress">In Progress</option>
              <option value="decided">Decided</option>
              <option value="abandoned">Abandoned</option>
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
            <div className="space-y-4">
              {options.map((option) => (
                <div key={option.id} className="glass p-4 rounded-xl border border-white/10">
                  {/* Option name */}
                  <div className="flex gap-2 items-center mb-3">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                      placeholder="Option name"
                    />
                    <button
                      onClick={() => handleRemoveOption(option.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
                      title="Remove option"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Pros */}
                  <div className="mb-3">
                    <div className="text-xs text-green-400 font-medium mb-2">Pros ({option.pros.length})</div>
                    <div className="space-y-1">
                      {option.pros.map((pro, index) => (
                        <div key={pro.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={pro.content}
                            onChange={(e) => handleUpdateProCon(pro.id, e.target.value, option.id, 'pro', index)}
                            className="flex-1 px-3 py-1.5 text-sm bg-green-500/10 border border-green-500/20 rounded-lg text-text-primary focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                            placeholder="Pro"
                          />
                          <button
                            onClick={() => handleDeleteProCon(pro.id, option.id, 'pro', index)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-all"
                            title="Remove pro"
                          >
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {/* Add pro input */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={newProInputs[option.id] || ''}
                          onChange={(e) => setNewProInputs({ ...newProInputs, [option.id]: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddPro(option.id, newProInputs[option.id] || '')}
                          className="flex-1 px-3 py-1.5 text-sm bg-green-500/5 border border-green-500/20 rounded-lg text-text-primary focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                          placeholder="Add pro..."
                        />
                        <button
                          onClick={() => handleAddPro(option.id, newProInputs[option.id] || '')}
                          className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded transition-all"
                          title="Add pro"
                        >
                          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cons */}
                  <div>
                    <div className="text-xs text-red-400 font-medium mb-2">Cons ({option.cons.length})</div>
                    <div className="space-y-1">
                      {option.cons.map((con, index) => (
                        <div key={con.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={con.content}
                            onChange={(e) => handleUpdateProCon(con.id, e.target.value, option.id, 'con', index)}
                            className="flex-1 px-3 py-1.5 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-text-primary focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                            placeholder="Con"
                          />
                          <button
                            onClick={() => handleDeleteProCon(con.id, option.id, 'con', index)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-all"
                            title="Remove con"
                          >
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {/* Add con input */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={newConInputs[option.id] || ''}
                          onChange={(e) => setNewConInputs({ ...newConInputs, [option.id]: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCon(option.id, newConInputs[option.id] || '')}
                          className="flex-1 px-3 py-1.5 text-sm bg-red-500/5 border border-red-500/20 rounded-lg text-text-primary focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                          placeholder="Add con..."
                        />
                        <button
                          onClick={() => handleAddCon(option.id, newConInputs[option.id] || '')}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-all"
                          title="Add con"
                        >
                          <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
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
