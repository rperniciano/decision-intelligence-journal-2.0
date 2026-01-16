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

export function EditDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');

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

        const response = await fetch(`http://localhost:3001/api/v1/decisions/${id}`, {
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

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log('Save clicked', { title, notes, status });
    navigate(`/decisions/${id}`);
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

          {/* Category (read-only for now) */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-secondary">
              {decision.category}
            </div>
          </div>

          {/* Options (read-only for now) */}
          {decision.options && decision.options.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Options ({decision.options.length})</label>
              <div className="space-y-2">
                {decision.options.map((option) => (
                  <div key={option.id} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="font-medium text-text-primary">{option.text}</div>
                    {option.isChosen && (
                      <span className="text-xs text-accent">Chosen</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
