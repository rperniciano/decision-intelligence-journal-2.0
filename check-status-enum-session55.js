const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'decision_status'
      ORDER BY enumsortorder;
    `
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Valid decision_status enum values:');
    data.forEach(row => console.log('-', row.enumlabel));
  }
})();
