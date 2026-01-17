// Run migration to add abandon_reason and abandon_note columns
// Session 38 - Complete Feature #88

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running abandon fields migration...\n');

  // Read migration SQL
  const sql = fs.readFileSync('migration-add-abandon-fields.sql', 'utf8');

  console.log('Migration SQL:');
  console.log(sql);
  console.log('\n');

  // Execute each statement separately (Supabase RPC can be finicky with multi-statement SQL)
  const statements = [
    `ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50)`,
    `ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT`
  ];

  for (const statement of statements) {
    console.log(`Executing: ${statement}`);

    const { data, error } = await supabase.rpc('exec_sql', {
      query: statement
    });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      if (error.message.includes('function') || error.code === '42883') {
        console.log('exec_sql not available, trying direct approach...');

        // We'll use the from() API to check if columns exist
        const { data: checkData, error: checkError } = await supabase
          .from('decisions')
          .select('abandon_reason, abandon_note')
          .limit(1);

        if (checkError) {
          console.error('Column check failed:', checkError);
          console.log('\n⚠️  Migration must be run manually in Supabase SQL Editor');
          console.log('Copy migration-add-abandon-fields.sql to SQL Editor and execute');
          return false;
        } else {
          console.log('✅ Columns already exist or query succeeded');
        }
      } else {
        console.error('Error:', error);
        return false;
      }
    } else {
      console.log('✅ Statement executed successfully');
    }
  }

  // Verify columns exist
  console.log('\nVerifying columns exist...');
  const { data, error } = await supabase
    .from('decisions')
    .select('id, abandon_reason, abandon_note')
    .limit(1);

  if (error) {
    console.error('❌ Verification failed:', error);
    console.log('\n⚠️  Migration must be run manually in Supabase SQL Editor');
    return false;
  }

  console.log('✅ Migration complete! Columns exist and are accessible.');
  return true;
}

runMigration()
  .then(success => {
    if (success) {
      console.log('\n✅ DATABASE MIGRATION SUCCESSFUL');
    } else {
      console.log('\n⚠️  See instructions above for manual migration');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
