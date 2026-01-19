-- Add outcome_satisfaction column to decisions table
-- This stores the 1-5 star rating when recording an outcome

ALTER TABLE decisions
ADD COLUMN outcome_satisfaction INTEGER NULL
CHECK (outcome_satisfaction IS NULL OR (outcome_satisfaction >= 1 AND outcome_satisfaction <= 5));

-- Add index for faster queries on satisfaction ratings
CREATE INDEX idx_decisions_outcome_satisfaction ON decisions(outcome_satisfaction) WHERE outcome_satisfaction IS NOT NULL;
