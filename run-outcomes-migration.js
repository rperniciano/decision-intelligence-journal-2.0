const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running outcomes and outcome_reminders migration...');

  // Read the SQL file
  const sql = fs.readFileSync(
    path.join(__dirname, 'migration-add-outcomes-tables.sql'),
    'utf8'
  );

  // Split by semicolon and filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

    try {
      // Use the admin client to execute raw SQL
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: statement })
      });

      if (!response.ok) {
        // Try alternative method with direct query
        const { error } = await supabase.from('_migrations').insert({});
        console.log('Note: Manual SQL execution required in Supabase Dashboard');
        console.log('Please run migration-add-outcomes-tables.sql in Supabase SQL Editor');
        break;
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  console.log('\n✓ Migration preparation complete');
  console.log('\nIMPORTANT: Please run the following SQL in Supabase SQL Editor:');
  console.log('File: migration-add-outcomes-tables.sql\n');
}

runMigration().catch(console.error);
