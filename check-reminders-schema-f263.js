const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('DecisionsFollowUpReminders table columns:');
    console.log(Object.keys(data[0]));
  } else {
    // Try to insert a dummy record to see the schema
    const { data: insertData, error: insertError } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(0);
    console.log('Could check schema with insert');
  }
}

checkSchema();
