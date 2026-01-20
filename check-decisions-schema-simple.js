const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('Checking decisions schema...');

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Sample decision columns:', Object.keys(data[0]).join(', '));
  } else {
    console.log('No decisions found, checking column info...');
    // Try to get column info
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'decisions' });

    if (colError) {
      console.error('Could not get columns:', colError.message);
    } else {
      console.log('Columns:', columns);
    }
  }
})();
