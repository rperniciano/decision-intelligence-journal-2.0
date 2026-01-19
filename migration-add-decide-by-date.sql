-- Migration: Add decide_by_date column to decisions table
-- Feature #258: Overdue items identified correctly
-- Run this in Supabase SQL Editor

-- Add decide_by_date column to decisions table
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS decide_by_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN decisions.decide_by_date IS 'Optional deadline date for making the decision. Used to track overdue decisions.';

-- Create index for efficient overdue queries
CREATE INDEX IF NOT EXISTS idx_decisions_decide_by_date
ON decisions(decide_by_date)
WHERE decide_by_date IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'decisions' AND column_name = 'decide_by_date';
