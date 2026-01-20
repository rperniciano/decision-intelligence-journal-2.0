-- Migration: Add emotional_state column to decisions table
-- Feature #78: Emotions stored per decision
-- Regression fix: Column was missing from database
-- Run this in Supabase SQL Editor

-- Add emotional_state column to decisions table
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS emotional_state TEXT;

-- Add comment for documentation
COMMENT ON COLUMN decisions.emotional_state IS 'The emotional state of the user when making this decision. Values: calm, confident, anxious, excited, uncertain, stressed, neutral, hopeful, frustrated.';

-- Create index for efficient queries filtering by emotion
CREATE INDEX IF NOT EXISTS idx_decisions_emotional_state
ON decisions(emotional_state)
WHERE emotional_state IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'decisions' AND column_name = 'emotional_state';
