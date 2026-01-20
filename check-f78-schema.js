/**
 * Check if emotional_state column exists in decisions table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkSchema() {
  console.log('Checking database schema for Feature #78...\n');

  try {
    // Check if emotional_state column exists
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'decisions' AND column_name = 'emotional_state';
      `
    });

    if (error) {
      // Try direct query instead
      const { data: columns, error: err } = await supabase
        .from('decisions')
        .select('*')
        .limit(1);

      if (err) {
        console.log('❌ Cannot access decisions table:', err.message);
        return;
      }

      // Check if emotional_state is in the response
      if (columns && columns.length > 0) {
        const sample = columns[0];
        console.log('Sample decision columns:', Object.keys(sample).join(', '));

        if ('emotional_state' in sample) {
          console.log('\n✅ emotional_state column EXISTS in database');
        } else {
          console.log('\n❌ emotional_state column DOES NOT EXIST');
          console.log('   Run migration: migration-add-emotional-state.sql');
        }
      }
    } else {
      if (data && data.length > 0) {
        console.log('✅ emotional_state column EXISTS');
        console.log('   Type:', data[0].data_type);
        console.log('   Nullable:', data[0].is_nullable);
      } else {
        console.log('❌ emotional_state column DOES NOT EXIST');
        console.log('   Run migration: migration-add-emotional-state.sql');
      }
    }
  } catch (err) {
    console.error('Error checking schema:', err.message);
  }
}

checkSchema();
