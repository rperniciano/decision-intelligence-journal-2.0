// Check what columns exist in DecisionsFollowUpReminders table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingColumns() {
  console.log('=== Checking Existing Columns in DecisionsFollowUpReminders ===\n');

  // Method 1: Try to query with a simple select
  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Cannot query table:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Found existing reminder record');
    console.log('Columns:', Object.keys(data[0]).sort());
    console.log('\nSample data:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Table is empty, trying alternative method...');

    // Method 2: Try inserting a minimal record to see what's required
    const minimalRecord = {
      decision_id: '00000000-0000-0000-0000-000000000000',
      user_id: '00000000-0000-0000-0000-000000000000'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('DecisionsFollowUpReminders')
      .insert(minimalRecord)
      .select();

    if (insertError) {
      console.log('❌ Insert failed');
      console.log('Error:', insertError.message);

      // Parse the error to find which columns are missing/required
      if (insertError.message.includes('null value in column')) {
        const match = insertError.message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`\n⚠️  Required column missing: "${match[1]}"`);
        }
      }

      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        const matches = insertError.message.matchAll(/column "([^"]+)" does not exist/g);
        for (const match of matches) {
          console.log(`\n⚠️  Column does not exist: "${match[1]}"`);
        }
      }
    } else {
      console.log('✅ Minimal insert succeeded');
      console.log('Columns:', Object.keys(insertData[0]).sort());

      // Clean up
      await supabase
        .from('DecisionsFollowUpReminders')
        .delete()
        .eq('decision_id', minimalRecord.decision_id);
    }
  }

  console.log('\n=== Expected Schema (from app_spec.txt) ===');
  console.log('Table: outcome_reminders (actual: DecisionsFollowUpReminders)');
  console.log('Columns:');
  console.log('  - id              UUID, PK');
  console.log('  - decision_id     UUID, FK');
  console.log('  - user_id         UUID, FK');
  console.log('  - remind_at       TIMESTAMPTZ  ← MISSING');
  console.log('  - status          VARCHAR(20)');
  console.log('  - created_at      TIMESTAMPTZ');

  console.log('\n=== Required Migration ===');
  console.log('-- Add missing remind_at column');
  console.log('ALTER TABLE "DecisionsFollowUpReminders"');
  console.log('ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ;');
  console.log('');
  console.log('COMMENT ON COLUMN "DecisionsFollowUpReminders".remind_at');
  console.log('IS \'UTC timestamp when the reminder should be sent (includes timezone info)\';');
}

checkExistingColumns().catch(console.error);
