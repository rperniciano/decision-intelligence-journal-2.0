import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running outcomes table migration...');

  const sql = readFileSync('./apps/api/migrations/create_outcomes_table.sql', 'utf8');

  // Execute the SQL using Supabase RPC
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error running migration:', error);
    console.log('Trying direct SQL execution via REST...');

    // Alternative: Use direct HTTP request to Supabase REST
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (response.ok) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.error('❌ Migration failed:', await response.text());
    }
  } else {
    console.log('✅ Migration completed successfully!');
  }
}

runMigration().catch(console.error);
