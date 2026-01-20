-- Create outcomes table for multiple check-ins per decision (Feature #77)
-- This allows tracking multiple outcomes/check-ins for a single decision over time

CREATE TABLE IF NOT EXISTS public.outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  result VARCHAR(20) NOT NULL CHECK (result IN ('better', 'as_expected', 'worse')),
  satisfaction SMALLINT CHECK (satisfaction >= 1 AND satisfaction <= 5),
  reflection_audio_url TEXT,
  reflection_transcript TEXT,
  learned TEXT,
  scheduled_for DATE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_number SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON public.outcomes(decision_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_check_in ON public.outcomes(decision_id, check_in_number);

-- Enable Row Level Security
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access outcomes for their own decisions
CREATE POLICY "Users can view outcomes for own decisions"
  ON public.outcomes
  FOR SELECT
  USING (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert outcomes for own decisions"
  ON public.outcomes
  FOR INSERT
  WITH CHECK (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outcomes for own decisions"
  ON public.outcomes
  FOR UPDATE
  USING (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete outcomes for own decisions"
  ON public.outcomes
  FOR DELETE
  USING (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );

-- Comment
COMMENT ON TABLE public.outcomes IS 'Stores multiple outcome check-ins per decision';
COMMENT ON COLUMN public.outcomes.check_in_number IS 'The check-in number (1st, 2nd, 3rd, etc.)';
COMMENT ON COLUMN public.outcomes.scheduled_for IS 'The date this check-in was scheduled for';
COMMENT ON COLUMN public.outcomes.learned IS 'AI-extracted learnings from reflection';
