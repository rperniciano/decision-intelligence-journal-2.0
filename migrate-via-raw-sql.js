// Attempt migration using Supabase raw SQL capabilities
// Session 38 - Complete Feature #88

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  console.log('Attempting to add abandon columns...\n');

  // Strategy: Try to select the columns, if error, we know they don't exist
  // If they exist, we're done
  console.log('1. Checking if columns already exist...');

  const { data: checkData, error: checkError } = await supabase
    .from('decisions')
    .select('abandon_reason, abandon_note')
    .limit(1);

  if (!checkError) {
    console.log('✅ Columns already exist!');
    console.log('abandon_reason and abandon_note are accessible\n');
    return true;
  }

  if (checkError.code === '42703') {
    console.log('❌ Columns do not exist (expected)');
    console.log('Error:', checkError.message, '\n');
  }

  console.log('2. Attempting to add columns via schema update...');

  // Try using Supabase's Management API
  // This would require a different approach - using the Supabase Management API
  // which requires additional setup

  console.log('⚠️  Cannot add columns programmatically without direct DB access\n');
  console.log('=' .repeat(70));
  console.log('MANUAL MIGRATION REQUIRED:');
  console.log('=' .repeat(70));
  console.log('\n📋 Follow these steps:');
  console.log('\n1. Open https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu');
  console.log('2. Navigate to: SQL Editor (left sidebar)');
  console.log('3. Click "New Query"');
  console.log('4. Paste this SQL:\n');
  console.log('   ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);');
  console.log('   ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT;');
  console.log('\n5. Click "Run" or press Ctrl+Enter');
  console.log('6. You should see "Success. No rows returned"');
  console.log('\n7. Run this script again to verify: node migrate-via-raw-sql.js');
  console.log('=' .repeat(70));
  console.log('\nOR use the Supabase Table Editor:');
  console.log('=' .repeat(70));
  console.log('\n1. Go to: Table Editor → decisions table');
  console.log('2. Click "+ New Column" (twice)');
  console.log('3. First column:');
  console.log('   - Name: abandon_reason');
  console.log('   - Type: varchar');
  console.log('   - Length: 50');
  console.log('   - Nullable: Yes (check)');
  console.log('4. Second column:');
  console.log('   - Name: abandon_note');
  console.log('   - Type: text');
  console.log('   - Nullable: Yes (check)');
  console.log('5. Click "Save"');
  console.log('=' .repeat(70));

  return false;
}

runMigration()
  .then(success => {
    if (success) {
      console.log('\n✅ MIGRATION COMPLETE - Ready for Feature #88 testing');
    } else {
      console.log('\n⏳ Awaiting manual migration completion');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
