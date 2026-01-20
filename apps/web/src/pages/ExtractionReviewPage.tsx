import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DecisionExtractionCard } from '../components/DecisionExtractionCard';
import { SkipLink } from '../components/SkipLink';

interface AIExtraction {
  title: string;
  options: Array<{
    name: string;
    pros: string[];
    cons: string[];
  }>;
  emotionalState: string;
  suggestedCategory: string | null;
  confidence: number;
}

export function ExtractionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [extraction, setExtraction] = useState<AIExtraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDecision() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) {
          setError('Not authenticated');
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

        const decision = await response.json();

        // Construct extraction object from decision data
        // Note: The database doesn't store aiExtraction as JSONB, so we build it from options
        const extraction: AIExtraction = {
          title: decision.title || 'Untitled Decision',
          options: (decision.options || []).map((opt: any) => ({
            name: opt.title || opt.name || 'Unnamed Option',
            pros: (opt.prosCons || opt.pros_cons || [])
              .filter((pc: any) => pc.type === 'pro')
              .map((pc: any) => pc.content),
            cons: (opt.prosCons || opt.pros_cons || [])
              .filter((pc: any) => pc.type === 'con')
              .map((pc: any) => pc.content),
          })),
          emotionalState: decision.emotionalState || decision.detected_emotional_state || 'neutral',
          suggestedCategory: decision.category || decision.categoryId || null,
          confidence: 0.8, // Default confidence since not stored
        };

        setExtraction(extraction);
      } catch (err) {
        console.error('Error fetching decision:', err);
        setError(err instanceof Error ? err.message : 'Failed to load extraction');
      } finally {
        setLoading(false);
      }
    }

    fetchDecision();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-bg-deep z-50 flex items-center justify-center">
        <SkipLink />
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading extraction...</p>
        </div>
        <div className="grain-overlay" />
      </div>
    );
  }

  if (error || !extraction) {
    return (
      <div className="fixed inset-0 bg-bg-deep z-50 flex items-center justify-center p-4">
        <SkipLink />
        <div className="glass p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-text-secondary mb-4">{error || 'Failed to load extraction data'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-accent hover:bg-accent-600 text-bg-deep rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        <div className="grain-overlay" />
      </div>
    );
  }

  return <DecisionExtractionCard decisionId={id!} extraction={extraction} />;
}

export default ExtractionReviewPage;
