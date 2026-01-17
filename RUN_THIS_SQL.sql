-- ============================================
-- Feature #88: Add Abandon Fields to Decisions
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Optional: Add comments for documentation
COMMENT ON COLUMN decisions.abandon_reason IS 'Short reason why decision was abandoned (e.g., "No longer relevant", "Too risky")';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note about abandonment';
