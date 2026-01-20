/**
 * Run migration to add emotional_state column
 * Feature #78: Emotions stored per decision
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  console.log('Running migration: Add emotional_state column to decisions table\n');
  console.log('='.repeat(60));

  try {
    // Execute the migration SQL using raw SQL query
    // Note: We'll use the Supabase SQL approach via admin API

    // First, let's check current state
    console.log('\n📋 Step 1: Checking current schema...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('decisions')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Error accessing decisions table:', sampleError.message);
      return;
    }

    const hasEmotionalState = sampleData.length > 0 && 'emotional_state' in sampleData[0];
    const hasDetectedEmotionalState = sampleData.length > 0 && 'detected_emotional_state' in sampleData[0];

    console.log(`   - emotional_state exists: ${hasEmotionalState ? '✅' : '❌'}`);
    console.log(`   - detected_emotional_state exists: ${hasDetectedEmotionalState ? '✅' : '❌'}`);

    // Since detected_emotional_state already exists, we might need to either:
    // 1. Add emotional_state as a separate column, OR
    // 2. Use detected_emotional_state as the emotional_state

    // For now, let's add emotional_state as a new column
    console.log('\n📋 Step 2: Adding emotional_state column...');

    // We need to run SQL directly via the client
    // Using a different approach - execute via PostgreSQL client
    const { error: migrateError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE decisions
        ADD COLUMN IF NOT EXISTS emotional_state TEXT;

        COMMENT ON COLUMN decisions.emotional_state IS 'The emotional state of the user when making this decision. Values: calm, confident, anxious, excited, uncertain, stressed, neutral, hopeful, frustrated.';

        CREATE INDEX IF NOT EXISTS idx_decisions_emotional_state
        ON decisions(emotional_state)
        WHERE emotional_state IS NOT NULL;
      `
    });

    if (migrateError) {
      console.log('❌ Migration failed:', migrateError.message);
      console.log('   Note: This migration must be run manually in Supabase SQL Editor');
      console.log('   File: migration-add-emotional-state.sql');
    } else {
      console.log('✅ Migration successful!');
    }

    // Verify
    console.log('\n📋 Step 3: Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('decisions')
      .select('id, emotional_state, detected_emotional_state')
      .limit(1);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Verification successful!');
      if (verifyData.length > 0) {
        console.log('   Sample columns:', Object.keys(verifyData[0]).join(', '));
      }
    }

  } catch (err) {
    console.error('\n❌ Migration error:', err.message);
    console.log('\n   Manual migration required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run the SQL from: migration-add-emotional-state.sql');
    console.log('   3. Verify column was added successfully');
  }

  console.log('\n' + '='.repeat(60));
}

runMigration();
