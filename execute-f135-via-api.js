/**
 * Execute Feature #135 Migration via Supabase Management API
 *
 * This script attempts to use the Supabase Management API to execute SQL
 */

require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Extract project reference from URL
// Format: https://doqojfsldvajmlscpwhu.supabase.co
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.log('❌ Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

console.log('Project Reference:', projectRef);

// Read migration SQL
const fs = require('fs');
const path = require('path');
const migrationPath = path.join(__dirname, 'apps/api/migrations/fix-reminders-table-f101.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

async function executeViaManagementAPI() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Feature #135 Migration via Management API');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Approach 1: Direct PostgreSQL via RPC\n');
  console.log('Supabase provides a postgresql_rpc endpoint that can execute SQL.');
  console.log('However, this requires the function to already exist.\n');

  // Check if we can create an RPC function first
  console.log('Alternative: Use Supabase REST API to create an RPC function\n');

  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION execute_reminders_migration()
    RETURNS void AS $$
    BEGIN
      ALTER TABLE "DecisionsFollowUpReminders"
      ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ;

      ALTER TABLE "DecisionsFollowUpReminders"
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

      CREATE INDEX IF NOT EXISTS idx_reminders_remind_at
      ON "DecisionsFollowUpReminders"(remind_at)
      WHERE status = 'pending';

      CREATE INDEX IF NOT EXISTS idx_reminders_user_id
      ON "DecisionsFollowUpReminders"(user_id);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  console.log('Attempting to create RPC function via REST API...\n');

  // Try to use the REST API to execute the CREATE FUNCTION
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: createFunctionSQL })
    });

    if (response.ok) {
      console.log('✅ Function created successfully\n');

      // Now call the function
      const execResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_reminders_migration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });

      if (execResponse.ok) {
        console.log('✅ Migration executed successfully!');
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('Feature #135 is now ready to test!');
        console.log('═══════════════════════════════════════════════════════\n');
        process.exit(0);
      }
    }
  } catch (err) {
    console.log('❌ REST API approach failed:', err.message);
  }

  console.log('\n⚠️  Automated migration execution failed\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('To complete this migration, please execute it manually:\n');

  console.log('Step 1: Open Supabase SQL Editor');
  console.log('─────────────────────────────────');
  console.log(`URL: https://supabase.com/dashboard/project/${projectRef}/sql\n`);

  console.log('Step 2: Copy and paste this SQL:');
  console.log('────────────────────────────────');
  console.log('───');
  console.log(migrationSQL);
  console.log('───\n');

  console.log('Step 3: Click "Run" button');
  console.log('───────────────────────────');
  console.log('The migration will complete in 2-3 seconds.\n');

  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(1);
}

executeViaManagementAPI();
