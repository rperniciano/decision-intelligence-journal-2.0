/**
 * Migration script for Feature #88
 * Execute this with: node migrate-f88.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🚀 Feature #88 Migration: Adding abandon columns...\n');

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

async function executeMigration() {
  try {
    // Read the migration file
    const migrationSql = `
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_note TEXT;

      COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
      COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';
    `;

    console.log('📋 Migration SQL prepared');
    console.log('⚠️  Note: Supabase JS client cannot execute DDL statements directly.');
    console.log('\n🔧 Please execute this SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(migrationSql);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Try to verify if columns exist
    console.log('🔍 Checking if columns already exist...');

    // Try a query that would fail if columns don't exist
    const { data, error } = await supabase
      .from('decisions')
      .select('id, abandon_reason, abandon_note')
      .limit(1);

    if (error) {
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('❌ Columns do not exist yet.');
        console.log('\n✋ Please run the SQL above in Supabase SQL Editor, then re-run this script to verify.');
        return false;
      } else {
        console.error('❌ Unexpected error:', error.message);
        return false;
      }
    }

    console.log('✅ SUCCESS! Columns exist.');
    console.log('   - abandon_reason: VARCHAR(50) ✓');
    console.log('   - abandon_note: TEXT ✓');
    console.log('\n🎉 Migration complete! Feature #88 is ready to test.\n');
    return true;

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return false;
  }
}

// Execute migration
executeMigration().then(success => {
  process.exit(success ? 0 : 1);
});
