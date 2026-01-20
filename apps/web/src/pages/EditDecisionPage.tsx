import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { SkipLink } from '../components/SkipLink';
import { useToast } from '../contexts/ToastContext';

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
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [chosenOptionId, setChosenOptionId] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
  const [abandonReason, setAbandonReason] = useState<string>('');
  const [abandonNote, setAbandonNote] = useState<string>('');
  const [draggedProCon, setDraggedProCon] = useState<{id: string; type: 'pro' | 'con'; sourceOptionId: string} | null>(null);
  const [errors, setErrors] = useState<{title?: string; chosenOption?: string; abandonReason?: string; decideByDate?: string}>({});
  const [decideByDate, setDecideByDate] = useState<string>('');

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
        setAbandonReason(data.abandon_reason || '');
        setAbandonNote(data.abandon_note || '');
        // Set decide_by_date if present (convert from ISO to YYYY-MM-DD format)
        // Otherwise default to today (feature #181: sensible default)
        if (data.decide_by_date) {
          const date = new Date(data.decide_by_date);
          setDecideByDate(date.toISOString().split('T')[0]);
        } else {
          // Default to today if no decide_by_date exists
          const today = new Date();
          setDecideByDate(today.toISOString().split('T')[0]);
        }
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

  const handleSwitchProCon = async (id: string, optionId: string, currentType: 'pro' | 'con', content: string, index: number) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const newType = currentType === 'pro' ? 'con' : 'pro';

      const response = await fetch(`${import.meta.env.VITE_API_URL}/pros-cons/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch pro/con');
      }

      // Update local state - move from pros to cons or vice versa
      setOptions(options.map(opt => {
        if (opt.id === optionId) {
          if (currentType === 'pro') {
            // Moving from pro to con
            const newPros = opt.pros.filter((_, i) => i !== index);
            const newCons = [...opt.cons, { id, content, type: 'con' as const }];
            return { ...opt, pros: newPros, cons: newCons };
          } else {
            // Moving from con to pro
            const newCons = opt.cons.filter((_, i) => i !== index);
            const newPros = [...opt.pros, { id, content, type: 'pro' as const }];
            return { ...opt, cons: newCons, pros: newPros };
          }
        }
        return opt;
      }));
    } catch (error) {
      console.error('Error switching pro/con:', error);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (proConId: string, type: 'pro' | 'con', sourceOptionId: string) => {
    setDraggedProCon({ id: proConId, type, sourceOptionId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = async (targetOptionId: string, e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedProCon || draggedProCon.sourceOptionId === targetOptionId) {
      setDraggedProCon(null);
      return; // Can't drop on same option
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      // Call API to move pro/con to new option
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pros-cons/${draggedProCon.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option_id: targetOptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move pro/con');
      }

      // Update local state: remove from source option and add to target option
      const sourceOption = options.find(opt => opt.id === draggedProCon.sourceOptionId);
      if (!sourceOption) return;

      const proConToMove = draggedProCon.type === 'pro'
        ? sourceOption.pros.find(p => p.id === draggedProCon.id)
        : sourceOption.cons.find(c => c.id === draggedProCon.id);

      if (!proConToMove) return;

      setOptions(options.map(opt => {
        if (opt.id === draggedProCon.sourceOptionId) {
          // Remove from source
          if (draggedProCon.type === 'pro') {
            return { ...opt, pros: opt.pros.filter(p => p.id !== draggedProCon.id) };
          } else {
            return { ...opt, cons: opt.cons.filter(c => c.id !== draggedProCon.id) };
          }
        } else if (opt.id === targetOptionId) {
          // Add to target
          if (draggedProCon.type === 'pro') {
            return { ...opt, pros: [...opt.pros, proConToMove] };
          } else {
            return { ...opt, cons: [...opt.cons, proConToMove] };
          }
        }
        return opt;
      }));

      setDraggedProCon(null);
    } catch (error) {
      console.error('Error moving pro/con:', error);
      alert('Failed to move pro/con');
      setDraggedProCon(null);
    }
  };

  // Get minimum date (today) for date picker
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (1 year from now) for sensible date range
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  // Validate the decide-by date
  const validateDecideByDate = (dateString: string): string => {
    if (!dateString) {
      return ''; // Empty is valid (optional field)
    }

    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(selectedDate.getTime())) {
      return 'Please enter a valid date';
    }

    // Check if date is in the past
    if (selectedDate < today) {
      return 'Decide-by date cannot be in the past';
    }

    // Check if date is too far in the future (more than 1 year)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (selectedDate > maxDate) {
      return 'Decide-by date cannot be more than 1 year from now';
    }

    return '';
  };

  // Handle date change with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDecideByDate(newDate);
    const error = validateDecideByDate(newDate);
    setErrors(prev => ({ ...prev, decideByDate: error || undefined }));
  };

  const handleSave = async () => {
    // Reset errors
    setErrors({});

    // Validation: Title is required and minimum length
    const newErrors: {title?: string; chosenOption?: string; abandonReason?: string; decideByDate?: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }

    // Validation: Chosen option is required when status is "decided"
    if (status === 'decided' && !chosenOptionId && options.length > 0) {
      newErrors.chosenOption = 'Please select which option you chose';
    }

    // Validation: Abandon reason is required when status is "abandoned"
    if (status === 'abandoned' && !abandonReason) {
      newErrors.abandonReason = 'Please select a reason for abandoning this decision';
    }

    // Validation: Decide-by date
    if (decideByDate) {
      const dateError = validateDecideByDate(decideByDate);
      if (dateError) {
        newErrors.decideByDate = dateError;
      }
    }

    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const updatePayload: any = {
        title: title.trim(),
        description: notes,
        status,
        decide_by_date: decideByDate || null,
      };

      // If status is "decided", include chosen_option_id
      if (status === 'decided' && chosenOptionId) {
        updatePayload.chosen_option_id = chosenOptionId;
      }

      // If status is "abandoned", include abandon_reason and abandon_note
      if (status === 'abandoned') {
        updatePayload.abandon_reason = abandonReason;
        updatePayload.abandon_note = abandonNote;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      // Check for session expiry (401 Unauthorized)
      if (response.status === 401) {
        // Clear session
        await supabase.auth.signOut();

        // Show alert
        alert('Your session has expired. Please log in again to save your changes.');

        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(`/decisions/${id}/edit`);
        navigate(`/login?returnTo=${returnUrl}`);
        setSaving(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update decision');
      }

      // Show success feedback
      showSuccess('Decision saved');

      // Navigate back to decision detail page
      navigate(`/decisions/${id}`);
    } catch (error) {
      console.error('Error saving decision:', error);
      showError('Failed to save decision. Please try again.');
      setSaving(false);
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
      <SkipLink />
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
          <h1 className="text-2xl font-semibold">Edit Decision</h1>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6" tabIndex={-1}>
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Title */}
          <div>
            <label htmlFor="edit-decision-title" className="block text-sm font-medium mb-2">Title</label>
            <input
              id="edit-decision-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // Clear error when user starts typing
                if (errors.title) {
                  setErrors({...errors, title: undefined});
                }
              }}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-text-primary focus:outline-none transition-all ${
                errors.title
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-white/10 focus:border-accent/50 focus:ring-1 focus:ring-accent/50'
              }`}
              placeholder="Enter decision title"
            />
            {errors.title && (
              <p role="alert" aria-live="polite" className="mt-1 text-sm text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="edit-decision-status" className="block text-sm font-medium mb-2">Status</label>
            <select
              id="edit-decision-status"
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

          {/* Decide-by Date */}
          <div>
            <label htmlFor="edit-decision-decide-by-date" className="block text-sm font-medium mb-2">
              Decide By (optional)
            </label>
            <input
              id="edit-decision-decide-by-date"
              type="date"
              value={decideByDate}
              onChange={handleDateChange}
              min={getMinDate()}
              max={getMaxDate()}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-text-primary focus:outline-none transition-all ${
                errors.decideByDate
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-white/10 focus:border-accent/50 focus:ring-1 focus:ring-accent/50'
              }`}
              aria-describedby={errors.decideByDate ? 'edit-decide-by-date-error' : 'edit-decide-by-date-hint'}
            />
            {errors.decideByDate ? (
              <p id="edit-decide-by-date-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-400">
                {errors.decideByDate}
              </p>
            ) : (
              <p id="edit-decide-by-date-hint" className="mt-1 text-sm text-text-secondary">
                Set a deadline for making this decision (up to 1 year from now)
              </p>
            )}
          </div>

          {/* Conditional UI for Decided status */}
          {status === 'decided' && options.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 glass p-4 rounded-xl border border-accent/20"
            >
              <div>
                <label htmlFor="edit-chosen-option" className="block text-sm font-medium mb-2 text-accent">
                  Which option did you choose? *
                </label>
                <select
                  id="edit-chosen-option"
                  value={chosenOptionId}
                  onChange={(e) => {
                    setChosenOptionId(e.target.value);
                    // Clear error when user selects
                    if (errors.chosenOption) {
                      setErrors({...errors, chosenOption: undefined});
                    }
                  }}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-text-primary focus:outline-none transition-all ${
                    errors.chosenOption
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-white/10 focus:border-accent/50 focus:ring-1 focus:ring-accent/50'
                  }`}
                  required
                >
                  <option value="">Select an option...</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.text}
                    </option>
                  ))}
                </select>
                {errors.chosenOption && (
                  <p role="alert" aria-live="polite" className="mt-1 text-sm text-red-400">{errors.chosenOption}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-accent">
                  Confidence Level: {confidenceLevel}/5
                </label>
                <div className="flex items-center gap-2" role="group" aria-label="Confidence level rating">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setConfidenceLevel(level)}
                      className={`p-2 rounded-lg transition-all ${
                        level <= confidenceLevel
                          ? 'text-accent scale-110'
                          : 'text-white/20 hover:text-white/40'
                      }`}
                      aria-label={`${level} star${level > 1 ? 's' : ''}`}
                      aria-pressed={level <= confidenceLevel}
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Conditional UI for Abandoned status */}
          {status === 'abandoned' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 glass p-4 rounded-xl border border-red-500/20"
            >
              <div>
                <label htmlFor="edit-abandon-reason" className="block text-sm font-medium mb-2 text-red-400">
                  Why are you abandoning this decision? *
                </label>
                <select
                  id="edit-abandon-reason"
                  value={abandonReason}
                  onChange={(e) => {
                    setAbandonReason(e.target.value);
                    // Clear error when user selects
                    if (errors.abandonReason) {
                      setErrors({...errors, abandonReason: undefined});
                    }
                  }}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-text-primary focus:outline-none transition-all ${
                    errors.abandonReason
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50'
                  }`}
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="No longer relevant">No longer relevant</option>
                  <option value="Too risky">Too risky</option>
                  <option value="Better alternative found">Better alternative found</option>
                  <option value="Insufficient information">Insufficient information</option>
                  <option value="Changed priorities">Changed priorities</option>
                  <option value="External factors">External factors</option>
                  <option value="Other">Other</option>
                </select>
                {errors.abandonReason && (
                  <p role="alert" aria-live="polite" className="mt-1 text-sm text-red-400">{errors.abandonReason}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-abandon-note" className="block text-sm font-medium mb-2 text-red-400">
                  Additional notes (optional)
                </label>
                <textarea
                  id="edit-abandon-note"
                  value={abandonNote}
                  onChange={(e) => setAbandonNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all resize-none"
                  placeholder="Explain why you're abandoning this decision..."
                />
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="edit-decision-notes" className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              id="edit-decision-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
              placeholder="Add notes about your decision"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="edit-decision-category" className="block text-sm font-medium mb-2">Category</label>
            <select
              id="edit-decision-category"
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
            <span className="block text-sm font-medium mb-2" id="edit-options-label">Options ({options.length})</span>
            <div className="space-y-4" role="region" aria-labelledby="edit-options-label">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="glass p-4 rounded-xl border border-white/10"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(option.id, e)}
                >
                  {/* Option name */}
                  <div className="flex gap-2 items-center mb-3">
                    <label htmlFor={`edit-option-${option.id}`} className="sr-only">Option name</label>
                    <input
                      id={`edit-option-${option.id}`}
                      type="text"
                      value={option.text}
                      onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                      placeholder="Option name"
                    />
                    <button
                      onClick={() => handleRemoveOption(option.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
                      aria-label={`Remove option: ${option.text}`}
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Pros */}
                  <div className="mb-3">
                    <label htmlFor={`edit-add-pro-${option.id}`} className="text-xs text-green-400 font-medium mb-2 block">Pros ({option.pros.length})</label>
                    <div className="space-y-1">
                      {option.pros.map((pro, index) => (
                        <div
                          key={pro.id}
                          className="flex gap-2 items-center"
                          draggable
                          onDragStart={() => handleDragStart(pro.id, 'pro', option.id)}
                        >
                          <label htmlFor={`edit-pro-${pro.id}`} className="sr-only">Edit pro</label>
                          <input
                            id={`edit-pro-${pro.id}`}
                            type="text"
                            value={pro.content}
                            onChange={(e) => handleUpdateProCon(pro.id, e.target.value, option.id, 'pro', index)}
                            className="flex-1 px-3 py-1.5 text-sm bg-green-500/10 border border-green-500/20 rounded-lg text-text-primary focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all cursor-move"
                            placeholder="Pro"
                          />
                          <button
                            onClick={() => handleSwitchProCon(pro.id, option.id, 'pro', pro.content, index)}
                            className="p-1.5 hover:bg-blue-500/20 rounded transition-all"
                            aria-label="Switch to con"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProCon(pro.id, option.id, 'pro', index)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-all"
                            aria-label="Remove pro"
                          >
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {/* Add pro input */}
                      <div className="flex gap-2 items-center">
                        <input
                          id={`edit-add-pro-${option.id}`}
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
                          aria-label="Add pro"
                        >
                          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cons */}
                  <div>
                    <label htmlFor={`edit-add-con-${option.id}`} className="text-xs text-red-400 font-medium mb-2 block">Cons ({option.cons.length})</label>
                    <div className="space-y-1">
                      {option.cons.map((con, index) => (
                        <div
                          key={con.id}
                          className="flex gap-2 items-center"
                          draggable
                          onDragStart={() => handleDragStart(con.id, 'con', option.id)}
                        >
                          <label htmlFor={`edit-con-${con.id}`} className="sr-only">Edit con</label>
                          <input
                            id={`edit-con-${con.id}`}
                            type="text"
                            value={con.content}
                            onChange={(e) => handleUpdateProCon(con.id, e.target.value, option.id, 'con', index)}
                            className="flex-1 px-3 py-1.5 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-text-primary focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all cursor-move"
                            placeholder="Con"
                          />
                          <button
                            onClick={() => handleSwitchProCon(con.id, option.id, 'con', con.content, index)}
                            className="p-1.5 hover:bg-blue-500/20 rounded transition-all"
                            aria-label="Switch to pro"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProCon(con.id, option.id, 'con', index)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-all"
                            aria-label="Remove con"
                          >
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {/* Add con input */}
                      <div className="flex gap-2 items-center">
                        <input
                          id={`edit-add-con-${option.id}`}
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
                          aria-label="Add con"
                        >
                          <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                <label htmlFor="edit-add-option" className="sr-only">Add new option</label>
                <input
                  id="edit-add-option"
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
                  aria-label="Add option"
                >
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
              disabled={saving}
              className="flex-1 px-6 py-3 bg-accent text-bg-deep font-medium rounded-full hover:bg-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
            <motion.button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 glass glass-hover rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default EditDecisionPage;
