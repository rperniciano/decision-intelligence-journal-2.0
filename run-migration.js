// Script to run database migration
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running database migration...');

    // Read SQL file
    const sql = readFileSync('./setup-database.sql', 'utf-8');

    // Split into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          // Try direct execution via REST API
          console.log('Executing statement...');
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });

          if (!response.ok) {
            console.warn('Could not execute via RPC, please run setup-database.sql manually in Supabase SQL Editor');
            break;
          }
        }
      }
    }

    console.log('Migration complete! If there were errors, please run setup-database.sql manually in Supabase SQL Editor.');
  } catch (error) {
    console.error('Migration error:', error);
    console.log('\nPlease run setup-database.sql manually in Supabase SQL Editor:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of setup-database.sql');
    console.log('4. Run the query');
  }
}

runMigration();
