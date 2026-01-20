const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOptionsTable() {
  console.log('Checking decision_options table...\n');

  const { data: options, error, count } = await supabase
    .from('options')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total options in database: ${count || 0}\n`);

  if (count && count > 0) {
    console.log('Sample options:\n');
    options.slice(0, 5).forEach((opt, i) => {
      console.log(`${i + 1}. Decision ID: ${opt.decision_id}`);
      console.log(`   Option name: ${opt.name}`);
      console.log(`   Pros: ${opt.pros ? opt.pros.join(', ') : 'None'}`);
      console.log(`   Cons: ${opt.cons ? opt.cons.join(', ') : 'None'}`);
      console.log(`   Position: ${opt.position}\n`);
    });
  }
}

checkOptionsTable();
