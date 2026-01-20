import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== Running Migration: Add decision_status enum values ===\n');

  const migrationSQL = fs.readFileSync('migration-add-decision-statuses.sql', 'utf-8');

  console.log('Migration SQL:');
  console.log(migrationSQL);
  console.log();

  // Supabase doesn't provide a direct SQL execution endpoint via REST API
  // We need to use PostgreSQL connection directly
  // However, we can use pgadmin or the Supabase dashboard

  console.log('NOTE: This migration must be executed manually in the Supabase dashboard:');
  console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
  console.log('2. Copy and paste the following SQL:');
  console.log();
  console.log('--- COPY BELOW ---');
  console.log(migrationSQL);
  console.log('--- END COPY ---');
  console.log();

  // For now, let's check the current status
  console.log('Checking current valid status values...');

  const statuses = ['draft', 'deliberating', 'decided', 'abandoned', 'reviewed'];
  const validStatuses = [];

  for (const status of statuses) {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select('status')
        .eq('status', status)
        .limit(1);

      if (error && error.message.includes('invalid input value for enum')) {
        console.log(`✗ "${status}" is NOT valid (needs to be added)`);
      } else if (error) {
        console.log(`? "${status}" - Error: ${error.message}`);
      } else {
        console.log(`✓ "${status}" is valid`);
        validStatuses.push(status);
      }
    } catch (e) {
      console.log(`? "${status}" - Exception: ${e.message}`);
    }
  }

  console.log();
  console.log('Summary:');
  console.log(`Valid statuses: ${validStatuses.join(', ')}`);
  console.log(`Missing statuses: ${statuses.filter(s => !validStatuses.includes(s)).join(', ')}`);
}

main().catch(console.error);
