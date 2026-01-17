# Database Migration Required for Feature #88

## Status
⚠️ **BLOCKING**: Feature #88 (Abandon decision workflow) requires database schema changes that cannot be automated via Supabase JS API.

## What's Needed
Add two columns to the `decisions` table:
- `abandon_reason` VARCHAR(50) - Short reason for abandonment
- `abandon_note` TEXT - Optional detailed notes

## Why Automation Failed
- Supabase doesn't expose DDL operations via REST API (security measure)
- No `exec_sql` RPC function exists in the project
- Direct PostgreSQL connection requires DB password not in .env
- Supabase Dashboard requires login credentials

## Current Status
- ✅ UI implemented (EditDecisionPage with abandon fields)
- ✅ API updated to accept abandon_reason and abandon_note
- ❌ Database columns don't exist → data cannot persist

## How to Complete Migration

### Option 1: Supabase SQL Editor (Recommended)
1. Open https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu
2. Log in to Supabase
3. Navigate to: **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Paste this SQL:
```sql
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT;
```
6. Click **"Run"** or press **Ctrl+Enter**
7. Verify success message: "Success. No rows returned"
8. Run verification: `node migrate-via-raw-sql.js`

### Option 2: Supabase Table Editor
1. Go to: **Table Editor** → **decisions** table
2. Click **"+ New Column"** (add first column)
   - Name: `abandon_reason`
   - Type: `varchar`
   - Length: `50`
   - Nullable: ✓ Yes
   - Click **"Save"**
3. Click **"+ New Column"** (add second column)
   - Name: `abandon_note`
   - Type: `text`
   - Nullable: ✓ Yes
   - Click **"Save"**
4. Run verification: `node migrate-via-raw-sql.js`

### Option 3: Direct PostgreSQL Connection
If you have the database password:
1. Get connection string from Supabase Dashboard → Settings → Database
2. Add `SUPABASE_DB_PASSWORD=your_password` to `.env`
3. Run: `node run-migration-pg.js`

## Verification
After running the migration, verify with:
```bash
node migrate-via-raw-sql.js
```

Should output:
```
✅ Columns already exist!
✅ MIGRATION COMPLETE - Ready for Feature #88 testing
```

## Next Steps After Migration
1. ✅ Verify columns exist
2. Test abandon workflow end-to-end
3. Verify abandon_reason and abandon_note persist in database
4. Add display of abandon data to DecisionDetailPage
5. Mark Feature #88 as passing

## Alternative: Skip and Document
If migration cannot be completed:
- Document as external blocker (database access required)
- Skip Feature #88: `Use feature_skip tool with feature_id=88`
- Document in progress notes
- Move to next feature

However, this should be last resort - the migration is straightforward and only requires dashboard access.
