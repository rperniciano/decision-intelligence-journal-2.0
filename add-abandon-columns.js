const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumns() {
  try {
    // Add abandon_reason column
    const { error: reasonError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE decisions
        ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);
      `
    });

    if (reasonError) {
      console.error('Error adding abandon_reason:', reasonError);
    } else {
      console.log('✅ Added abandon_reason column');
    }

    // Add abandon_note column
    const { error: noteError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE decisions
        ADD COLUMN IF NOT EXISTS abandon_note TEXT;
      `
    });

    if (noteError) {
      console.error('Error adding abandon_note:', noteError);
    } else {
      console.log('✅ Added abandon_note column');
    }

    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

addColumns();
