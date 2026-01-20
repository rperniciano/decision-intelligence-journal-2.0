const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try different schemas
  const schemas = ['', 'public', 'private', 'auth', 'mcp', 'features'];

  for (const schema of schemas) {
    const table = schema ? `${schema}.features` : 'features';
    console.log(`Trying: ${table}`);

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', 203)
      .maybeSingle();

    if (data) {
      console.log('FOUND!');
      console.log('Name:', data.name);
      console.log('Description:', data.description);
      console.log('Steps:', data.steps);
      console.log('Passes:', data.passes);
      console.log('In Progress:', data.in_progress);
      break;
    } else if (!error) {
      console.log('No data, but table exists');
    } else {
      console.log('Error:', error.message);
    }
    console.log('---');
  }

  // Also list all tables
  console.log('\nListing tables from information_schema...');
  const { data: tables } = await supabase.rpc('get_tables');
  console.log('Tables:', tables);
}

main();
