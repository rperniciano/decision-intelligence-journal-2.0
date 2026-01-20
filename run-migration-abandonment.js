import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running migration: Add abandonment columns...');

  try {
    // Read the migration SQL
    const sql = fs.readFileSync(
      path.join(__dirname, 'migration-add-abandonment-columns.sql'),
      'utf-8'
    );

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);

      // Use raw SQL execution via PostgreSQL client
      // Note: Supabase JS client doesn't support raw DDL, so we need to use rpc
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // If rpc doesn't exist, try direct query approach
        console.log('RPC not available, using alternative approach...');
        console.log('Please run this SQL manually in Supabase SQL Editor:');
        console.log(sql);
        console.log('\nSQL Editor URL: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
        return;
      }

      console.log('Success:', data);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    const sql = fs.readFileSync(
      path.join(__dirname, 'migration-add-abandonment-columns.sql'),
      'utf-8'
    );
    console.log(sql);
    console.log('\nSQL Editor URL: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
  }
}

runMigration();
