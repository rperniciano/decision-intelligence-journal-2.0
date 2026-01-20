import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Emotional states with emojis
const EMOTIONAL_STATES = [
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'uncertain', label: 'Uncertain', emoji: '🤔' },
  { value: 'stressed', label: 'Stressed', emoji: '😓' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
] as const;

// Common categories
const COMMON_CATEGORIES = [
  'Career',
  'Finance',
  'Health',
  'Relationships',
  'Personal Growth',
  'Travel',
  'Education',
  'Lifestyle',
  'Home',
  'Other',
];

interface ExtractionOption {
  name: string;
  pros: string[];
  cons: string[];
}

interface AIExtraction {
  title: string;
  options: ExtractionOption[];
  emotionalState: string;
  suggestedCategory: string | null;
  confidence: number;
}

interface DecisionExtractionCardProps {
  decisionId: string;
  extraction: AIExtraction;
  onSave?: () => void;
}

export function DecisionExtractionCard({
  decisionId,
  extraction,
  onSave,
}: DecisionExtractionCardProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Editable state
  const [title, setTitle] = useState(extraction.title);
  const [options, setOptions] = useState<ExtractionOption[]>(extraction.options);
  const [emotionalState, setEmotionalState] = useState(extraction.emotionalState);
  const [category, setCategory] = useState(extraction.suggestedCategory || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Add rim-light-accent class if not exists
  useEffect(() => {
    // Add the accent rim lighting dynamically if not in CSS
    const style = document.createElement('style');
    style.textContent = `
      .rim-light-accent::before {
        background: linear-gradient(
          135deg,
          rgba(0, 212, 170, 0.3) 0%,
          rgba(0, 212, 170, 0.1) 50%,
          rgba(0, 212, 170, 0.2) 100%
        );
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Update the decision with edited title, emotional state, and category
      const updateData: any = {
        title,
        emotional_state: emotionalState,
      };

      // Add category if provided
      if (category) {
        updateData.category = category;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/decisions/${decisionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save decision');
      }

      if (onSave) {
        onSave();
      } else {
        navigate(`/decisions/${decisionId}`);
      }
    } catch (error) {
      console.error('Error saving decision:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateOptionName = (index: number, newName: string) => {
    const newOptions = [...options];
    newOptions[index].name = newName;
    setOptions(newOptions);
  };

  const updatePro = (optionIndex: number, proIndex: number, newContent: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].pros[proIndex] = newContent;
    setOptions(newOptions);
  };

  const updateCon = (optionIndex: number, conIndex: number, newContent: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].cons[conIndex] = newContent;
    setOptions(newOptions);
  };

  const addPro = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].pros.push('');
    setOptions(newOptions);
  };

  const addCon = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].cons.push('');
    setOptions(newOptions);
  };

  const removePro = (optionIndex: number, proIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].pros.splice(proIndex, 1);
    setOptions(newOptions);
  };

  const removeCon = (optionIndex: number, conIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].cons.splice(conIndex, 1);
    setOptions(newOptions);
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      setCategory(newCategoryName.trim());
      setShowCategoryInput(false);
      setNewCategoryName('');
    }
  };

  const currentEmotion = EMOTIONAL_STATES.find((e) => e.value === emotionalState);

  return (
    <div className="fixed inset-0 bg-bg-deep z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 glass glass-hover rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">Review Your Decision</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-accent hover:bg-accent-600 text-bg-deep rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Confidence indicator */}
          {extraction.confidence < 0.8 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 glass rounded-lg border border-amber-500/20 bg-amber-500/10"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-200">
                  I'm not 100% sure I understood everything correctly. Please review and edit anything that doesn't seem right.
                </p>
              </div>
            </motion.div>
          )}

          {/* Title - Stagger reveal 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Decision Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 glass rounded-lg text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="What decision are you making?"
            />
          </motion.div>

          {/* Emotional State - Stagger reveal 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-text-secondary mb-2">
              How are you feeling about this?
            </label>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full px-4 py-3 glass glass-hover rounded-lg text-left flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{currentEmotion?.emoji}</span>
                  <span className="text-text-primary">{currentEmotion?.label}</span>
                </span>
                <svg className={`w-5 h-5 text-text-secondary transition-transform ${showEmojiPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 glass rounded-lg p-2 grid grid-cols-3 gap-1"
                  >
                    {EMOTIONAL_STATES.map((state) => (
                      <button
                        key={state.value}
                        onClick={() => {
                          setEmotionalState(state.value);
                          setShowEmojiPicker(false);
                        }}
                        className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                          emotionalState === state.value
                            ? 'bg-accent/20'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <span className="text-2xl">{state.emoji}</span>
                        <span className="text-xs text-text-secondary">{state.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Category - Stagger reveal 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Category (optional)
            </label>
            <div className="relative">
              {!showCategoryInput ? (
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-4 py-3 glass rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">No category</option>
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__create__">+ Create new category</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCategory();
                      } else if (e.key === 'Escape') {
                        setShowCategoryInput(false);
                        setNewCategoryName('');
                      }
                    }}
                    placeholder="New category name..."
                    className="flex-1 px-4 py-3 glass rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateCategory}
                    className="px-4 py-3 bg-accent hover:bg-accent-600 text-bg-deep rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCategoryInput(false);
                      setNewCategoryName('');
                    }}
                    className="px-4 py-3 glass glass-hover rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Options - Stagger reveal 4+ */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-secondary">
              Your Options
            </label>

            {options.map((option, optionIndex) => (
              <motion.div
                key={optionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + optionIndex * 0.1 }}
                className="glass p-4 rounded-xl rim-light-accent"
              >
                {/* Option name */}
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => updateOptionName(optionIndex, e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 rounded-lg text-text-primary font-medium mb-3 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder={`Option ${optionIndex + 1}`}
                />

                {/* Pros */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-emerald-400">Pros</h4>
                    <button
                      onClick={() => addPro(optionIndex)}
                      className="text-xs text-accent hover:text-accent-600 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {option.pros.map((pro, proIndex) => (
                      <div key={proIndex} className="flex gap-2">
                        <span className="text-emerald-400 mt-2">✓</span>
                        <input
                          type="text"
                          value={pro}
                          onChange={(e) => updatePro(optionIndex, proIndex, e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/5 rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                          placeholder="Reason this is good..."
                        />
                        <button
                          onClick={() => removePro(optionIndex, proIndex)}
                          className="p-2 text-rose-400 hover:text-rose-300 transition-colors"
                          aria-label="Remove pro"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-rose-400">Cons</h4>
                    <button
                      onClick={() => addCon(optionIndex)}
                      className="text-xs text-accent hover:text-accent-600 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {option.cons.map((con, conIndex) => (
                      <div key={conIndex} className="flex gap-2">
                        <span className="text-rose-400 mt-2">✗</span>
                        <input
                          type="text"
                          value={con}
                          onChange={(e) => updateCon(optionIndex, conIndex, e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/5 rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                          placeholder="Reason this is concerning..."
                        />
                        <button
                          onClick={() => removeCon(optionIndex, conIndex)}
                          className="p-2 text-rose-400 hover:text-rose-300 transition-colors"
                          aria-label="Remove con"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* "Not quite right?" section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 glass rounded-lg border border-white/10"
          >
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Not quite right?
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/record')}
                className="flex-1 px-4 py-2 glass glass-hover rounded-lg text-sm font-medium transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={() => navigate('/decisions/new')}
                className="flex-1 px-4 py-2 glass glass-hover rounded-lg text-sm font-medium transition-colors"
              >
                Enter Manually
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default DecisionExtractionCard;
