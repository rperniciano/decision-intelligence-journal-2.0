-- Migration: Add 'deliberating' and 'reviewed' to decision_status enum
-- Feature #89: Transition to Reviewed status

-- Step 1: Add new values to the enum (PostgreSQL requires ALTER TYPE ... ADD VALUE)
ALTER TYPE decision_status ADD VALUE IF NOT EXISTS 'deliberating';
ALTER TYPE decision_status ADD VALUE IF NOT EXISTS 'reviewed';

-- Verification query (run separately to check):
-- SELECT unnest(enum_range(NULL::decision_status));
