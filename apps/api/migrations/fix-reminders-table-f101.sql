-- ============================================================================
-- Feature #101: Set and manage reminder - Database Schema Fix
-- ============================================================================
-- This migration fixes the schema mismatch in DecisionsFollowUpReminders table
--
-- Problem: The table is missing required columns specified in app_spec.txt:
--   - remind_at TIMESTAMPTZ (when the reminder should be sent)
--   - user_id UUID (FK to profiles)
--
-- Impact: Without these columns, the following features cannot work:
--   - Background job for due reminders (reminderBackgroundJob.ts line 91)
--   - POST /api/v1/decisions/:id/reminders (server.ts line 2001)
--   - PATCH /api/v1/decisions/:id/reminders/:reminderId (server.ts line 2081)
--   - GET /api/v1/pending-reviews (server.ts line 2094)
--
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Run this migration script
-- 3. Verify no errors occurred
-- 4. Feature #101 will work immediately after migration
-- ============================================================================

-- Add remind_at column (UTC timestamp for when reminder should trigger)
ALTER TABLE "DecisionsFollowUpReminders"
ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ;

COMMENT ON COLUMN "DecisionsFollowUpReminders".remind_at
IS 'UTC timestamp when the reminder should be sent (includes timezone info)';

-- Add user_id column (foreign key to profiles)
ALTER TABLE "DecisionsFollowUpReminders"
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

COMMENT ON COLUMN "DecisionsFollowUpReminders".user_id
IS 'Foreign key to profiles table (user who owns the reminder)';

-- Create index on remind_at for efficient querying of due reminders
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at
ON "DecisionsFollowUpReminders"(remind_at)
WHERE status = 'pending';

COMMENT ON INDEX idx_reminders_remind_at
IS 'Index for efficiently finding due pending reminders';

-- Create index on user_id for efficient user-specific queries
CREATE INDEX IF NOT EXISTS idx_reminders_user_id
ON "DecisionsFollowUpReminders"(user_id);

COMMENT ON INDEX idx_reminders_user_id
IS 'Index for efficiently fetching reminders by user';

-- ============================================================================
-- Verification Queries (run after migration to verify)
-- ============================================================================

-- Check table schema
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'DecisionsFollowUpReminders'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'DecisionsFollowUpReminders';

-- ============================================================================
-- Expected Schema After Migration
-- ============================================================================
-- Column      | Type                        | Nullable | Default
-- ------------|----------------------------|----------|----------------------------------------
-- id          | UUID                        | NO       | uuid_generate_v4()
-- decision_id | UUID                        | NO       |
-- user_id     | UUID                        | YES      | (added by this migration)
-- remind_at   | TIMESTAMPTZ                 | YES      | (added by this migration)
-- status      | VARCHAR(20)                 | NO       | 'pending'
-- created_at  | TIMESTAMPTZ                 | NO       | now()
--
-- Indexes:
-- - idx_reminders_remind_at (partial index on status='pending')
-- - idx_reminders_user_id
--
-- ============================================================================
