#!/usr/bin/env node
/**
 * Migration script for Feature #88
 * Adds abandon_reason and abandon_note columns to decisions table
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting Feature #88 migration...\n');

  try {
    // Check if columns already exist
    console.log('📊 Checking if columns already exist...');

    const { data: existingColumns, error: checkError } = await supabase
      .rpc('get_table_columns', { table_name: 'decisions' })
      .select('column_name')
      .in('column_name', ['abandon_reason', 'abandon_note']);

    // If the RPC doesn't exist, we'll try the migration anyway
    const hasReasonColumn = existingColumns?.some(c => c.column_name === 'abandon_reason') || false;
    const hasNoteColumn = existingColumns?.some(c => c.column_name === 'abandon_note') || false;

    if (hasReasonColumn && hasNoteColumn) {
      console.log('✅ Columns already exist, skipping migration\n');
      return;
    }

    // Execute the migration SQL using Supabase SQL editor
    // Since we can't execute DDL directly via the client,
    // we'll output the SQL that needs to be run manually
    console.log('\n📋 Migration SQL (execute this in Supabase SQL Editor):\n');
    console.log('─'.repeat(60));
    console.log(`-- Migration to add abandonment support (Feature #88)
-- Add columns for tracking abandoned decisions with reason and note

-- Add abandon_reason column (VARCHAR 50 to store reason category)
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

-- Add abandon_note column (TEXT for optional detailed notes)
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Add comment for documentation
COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions (e.g., "too_complex", "no_longer_relevant", "outside_influence")';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';`);
    console.log('─'.repeat(60));
    console.log('\n⚠️  NOTE: Please execute the SQL above in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
    console.log('After running the migration, press Enter to continue...');
    console.log('(Or press Ctrl+C to exit and run manually)\n');

    // Wait for user to confirm
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Verify the migration
    console.log('\n✅ Verifying migration...');

    const { data: columns, error: verifyError } = await supabase
      .from('decisions')
      .select('abandon_reason, abandon_note')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      console.error('\nPlease ensure you ran the SQL migration in Supabase SQL Editor');
      process.exit(1);
    }

    console.log('✅ Migration successful! Columns added.');
    console.log('\n🎉 Feature #88 database migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
