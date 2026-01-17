-- Add abandon_reason and abandon_note columns to decisions table
-- Migration for Feature #88: Transition to Abandoned status

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Add comment for documentation
COMMENT ON COLUMN decisions.abandon_reason IS 'Short reason why decision was abandoned (e.g., "No longer relevant", "Too risky", "Better alternative found")';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note about abandonment';
