const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check if outcomes table exists and what its structure is
  const { data, error } = await supabase
    .from('decision_outcomes')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error or table does not exist:', error.message);
  } else {
    if (data && data.length > 0) {
      console.log('decision_outcomes table columns:', Object.keys(data[0]));
      console.log('Sample row:', data[0]);
    } else {
      console.log('decision_outcomes table exists but is empty');
      // Try to see what happens when we query with no rows
      const { error: schemaError } = await supabase
        .from('decision_outcomes')
        .insert({})
        .select();

      console.log('Schema error (shows required fields):', schemaError);
    }
  }
})();
