# Feature #263 Regression Report

## Feature
**ID:** 263
**Name:** Quiet hours respected for notifications
**Category:** Temporal & Timezone

## Regression Found
**Status:** ✗ REGRESSION DETECTED - Feature is fundamentally broken

## Root Cause
The `follow_up_date` column in the `decisions` table is defined as `date` type (not `timestamp` or `timestamptz`), which stores **only the date** without time-of-day information.

### Evidence
```sql
follow_up_date (raw): 2026-01-20
follow_up_date (parsed): 2026-01-20T00:00:00.000Z
```

All follow-up dates are stored as midnight UTC, regardless of what time is specified in the insert.

## Impact
**Feature #263 cannot work as designed** because:
1. The filtering logic requires comparing the follow_up time to quiet hours (e.g., "hide reminders due between 18:00-19:00")
2. Without time-of-day data, it's impossible to determine if a reminder is due "during quiet hours"
3. All reminders appear to be due at midnight, which is either before or after quiet hours depending on the timezone

## Code Review
The API code in `apps/api/src/server.ts` (lines 2180-2240) **correctly implements** the quiet hours filtering logic:
- ✓ Correctly detects if current time is within quiet hours
- ✓ Correctly calculates quiet start/end times in user's timezone
- ✓ Correctly filters decisions based on follow_up_date comparison
- ✓ Server logs confirm the filter code executes with correct values

**The code is working correctly.** The problem is the database schema.

## Required Fix
To make Feature #263 work, the database schema must be altered:

```sql
-- Option 1: Convert existing column to timestamp
ALTER TABLE decisions ALTER COLUMN follow_up_date TYPE timestamp;

-- Option 2: Add a new timestamp column and migrate data
ALTER TABLE decisions ADD COLUMN follow_up_at timestamp;
UPDATE decisions SET follow_up_at = follow_up_date::timestamp;
```

Additionally, the application code must be updated to:
1. Store full timestamps (including time) in `follow_up_date`
2. Update UI to allow users to specify time-of-day for follow-up reminders
3. Migrate existing data (currently all at midnight) to appropriate times

## Previous Status
This feature was marked as **PASSING** (282/291 - 96.9%), but this was incorrect. The feature was never properly tested with time-specific data. Tests only checked whether quiet hours settings were stored/retrieved, not whether filtering actually worked.

## Recommendation
**Status:** Feature #263 should be marked as **FAILING**

The feature description states:
> "Set quiet hours 10pm-8am. If reminder due during quiet hours, verify notification delayed until 8am."

This functionality **cannot be implemented** with the current database schema.

---

**Tested by:** Regression Testing Agent
**Date:** 2026-01-20
**Session:** Feature verification for #263
