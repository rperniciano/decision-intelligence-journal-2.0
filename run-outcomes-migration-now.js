const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

(async () => {
  try {
    // Read the migration SQL file
    const sql = fs.readFileSync('migration-add-outcomes-tables.sql', 'utf8');

    console.log('Running migration to create outcomes tables...');

    // Execute the SQL directly using the REST API
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('Migration failed:', error);
      console.log('Status:', response.status);

      // Try alternative: split into individual statements
      console.log('\nTrying alternative method: executing statements individually...');
      const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

      for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;

        try {
          const result = await supabase.rpc('exec_sql', { query: trimmed + ';' });
          if (result.error) {
            console.log(`Statement failed: ${trimmed.substring(0, 50)}...`);
            console.log('Error:', result.error.message);
          } else {
            console.log(`✓ Executed: ${trimmed.substring(0, 50)}...`);
          }
        } catch (err) {
          console.log(`Error on statement: ${err.message}`);
        }
      }
    } else {
      console.log('✓ Migration completed successfully!');
      const result = await response.json();
      console.log('Result:', result);
    }

    // Verify tables were created
    console.log('\nVerifying tables...');
    const { data: outcomes, error: outcomesError } = await supabase
      .from('outcomes')
      .select('*')
      .limit(1);

    if (outcomesError) {
      console.log('❌ outcomes table not found:', outcomesError.message);
    } else {
      console.log('✓ outcomes table exists');
    }

    const { data: reminders, error: remindersError } = await supabase
      .from('outcome_reminders')
      .select('*')
      .limit(1);

    if (remindersError) {
      console.log('❌ outcome_reminders table not found:', remindersError.message);
    } else {
      console.log('✓ outcome_reminders table exists');
    }

  } catch (error) {
    console.error('Error running migration:', error);
  }
})();
