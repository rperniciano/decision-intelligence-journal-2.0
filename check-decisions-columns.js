const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Query a decision to see all columns
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Decision columns:', Object.keys(data[0]));
    } else {
      console.log('No decisions found, checking table structure...');
      // Try to insert empty to see available columns
      const { error: insertError } = await supabase
        .from('decisions')
        .insert({})
        .select();

      console.log('Insert error shows required fields:', insertError);
    }
  }
})();
