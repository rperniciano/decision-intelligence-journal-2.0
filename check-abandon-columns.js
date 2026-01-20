// Script to check if abandon_reason and abandon_note columns exist
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkColumns() {
  try {
    // Try to select a decision with abandon columns
    const { data, error } = await supabase
      .from('decisions')
      .select('id, abandon_reason, abandon_note')
      .limit(1);

    if (error) {
      console.log('❌ Columns do NOT exist:', error.message);
      console.log('\nYou need to run the migration:');
      console.log('psql -h db.pgwzemtxzjkdqzzfecoz.supabase.co -U postgres -d postgres -f migration-add-abandonment-columns.sql');
      process.exit(1);
    }

    console.log('✅ abandon_reason and abandon_note columns EXIST in database');
    console.log('\nSample data:', data);
    process.exit(0);
  } catch (err) {
    console.error('Error checking columns:', err.message);
    process.exit(1);
  }
}

checkColumns();
