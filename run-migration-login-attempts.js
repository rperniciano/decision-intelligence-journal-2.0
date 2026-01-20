require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'apps/api/migrations/add_login_attempts.sql'),
    'utf8'
  );

  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Running ${statements.length} SQL statements...`);

  for (const statement of statements) {
    console.log(`\nExecuting: ${statement.substring(0, 50)}...`);

    // Use rpc to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      // Try direct SQL via REST
      try {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql_query: statement })
        });
        console.log('Response status:', response.status);
      } catch (e) {
        console.log('Note: Migration may need to be run manually in Supabase dashboard SQL editor');
        console.log('SQL to run:\n', statement);
      }
    }
  }

  console.log('\n✓ Migration completed');
  console.log('\nPlease run this SQL in Supabase Dashboard > SQL Editor:');
  console.log('---');
  console.log(sql);
  console.log('---');
}

runMigration();
