// Temporary test page with mock data to test Cancel button functionality
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock decision data
const mockDecision = {
  id: 'test-123',
  title: 'Test Decision for Cancel Testing',
  status: 'decided',
  category: 'Testing',
  emotionalState: 'Confident',
  createdAt: new Date().toISOString(),
  options: [
    {
      id: '1',
      text: 'Option A',
      pros: ['Pro 1', 'Pro 2'],
      cons: ['Con 1'],
      isChosen: true
    },
    {
      id: '2',
      text: 'Option B',
      pros: ['Pro 1'],
      cons: ['Con 1', 'Con 2']
    }
  ],
  notes: 'Original notes before editing.'
};

export function EditDecisionPageTest() {
  const navigate = useNavigate();
  const [title, setTitle] = useState(mockDecision.title);
  const [notes, setNotes] = useState(mockDecision.notes);
  const [status, setStatus] = useState(mockDecision.status);

  const handleSave = async () => {
    console.log('Save clicked (mock) - no actual save', { title, notes, status });
    // In a real scenario, this would save to the API
    navigate('/test-modal');
  };

  const handleCancel = () => {
    console.log('Cancel clicked - returning to previous page');
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">Edit Decision (Test Mode)</h1>
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
              {mockDecision.category}
            </div>
          </div>

          {/* Options (read-only for now) */}
          {mockDecision.options && mockDecision.options.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Options ({mockDecision.options.length})</label>
              <div className="space-y-2">
                {mockDecision.options.map((option) => (
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

export default EditDecisionPageTest;
