const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('id', 203)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Feature #203:');
  console.log('===============');
  console.log('Name:', data.name);
  console.log('Category:', data.category);
  console.log('Description:', data.description);
  console.log('Steps:', data.steps);
  console.log('Passes:', data.passes);
  console.log('In Progress:', data.in_progress);
}

main();
