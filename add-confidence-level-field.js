const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addConfidenceLevelField() {
  // Add confidence_level column to decisions table
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS confidence_level SMALLINT
      CHECK (confidence_level >= 1 AND confidence_level <= 5);
    `
  });

  if (error) {
    console.error('Error adding confidence_level field:', error);
  } else {
    console.log('Successfully added confidence_level field to decisions table');
  }
}

addConfidenceLevelField();
