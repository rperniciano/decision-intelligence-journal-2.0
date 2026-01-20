#!/bin/bash

# ============================================================================
# Feature #135: Try to use Supabase CLI to execute migration
# ============================================================================

echo "================================================================================"
echo "Feature #135: Supabase CLI Migration Attempt"
echo "================================================================================"
echo ""

# Check if already linked
if [ -d .supabase ]; then
  echo "✅ Supabase project already linked"
  echo ""

  # Try to push migration
  echo "🚀 Attempting to push migration..."
  echo "-------------------------------------------"
  npx supabase db push --db-url "postgresql://postgres.db_doqojfsldvajmlscpwhu:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" 2>&1 || echo "Push failed (expected - no password)"

else
  echo "📋 Project not linked. Attempting to link..."
  echo "-------------------------------------------"

  # Try to link (will likely fail without password)
  npx supabase link --project-ref doqojfsldvajmlscpwhu 2>&1 || echo "Link failed (expected - requires password)"
fi

echo ""
echo "================================================================================"
echo "CONCLUSION"
echo "================================================================================"
echo ""
echo "Supabase CLI requires database password to execute migrations."
echo ""
echo "To execute the migration manually:"
echo "1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql"
echo "2. Copy: apps/api/migrations/fix-reminders-table-f101.sql"
echo "3. Paste and Run"
echo ""
echo "================================================================================"
echo ""
