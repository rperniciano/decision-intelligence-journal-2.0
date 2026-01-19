import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('Running migration: Add outcome_satisfaction column');

    // Run the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: fs.readFileSync(join(__dirname, 'migration-add-outcome-satisfaction.sql'), 'utf8')
    });

    if (error) {
      // Try direct SQL via REST
      console.log('RPC failed, trying direct SQL approach...');
      const sql = `
        ALTER TABLE decisions
        ADD COLUMN IF NOT EXISTS outcome_satisfaction INTEGER NULL;

        COMMENT ON COLUMN decisions.outcome_satisfaction IS 'Satisfaction rating 1-5 stars when recording outcome';
      `;

      // Supabase doesn't support direct SQL execution via client library
      // We need to use the SQL editor or REST API
      console.log('SQL to run manually:');
      console.log(sql);
      console.log('\nPlease run this in Supabase SQL Editor:');
      console.log('https://doqojfsldvajmlscpwhu.supabase.co/project/default/sql');

      return;
    }

    console.log('Migration completed successfully!', data);
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log(fs.readFileSync(join(__dirname, 'migration-add-outcome-satisfaction.sql'), 'utf8'));
  }
}

runMigration();
