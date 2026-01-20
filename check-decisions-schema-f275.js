const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking decisions table schema...\n');

  // Get a sample decision to see its structure
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (decisions && decisions.length > 0) {
    console.log('Decision record structure:');
    console.log('Fields:', Object.keys(decisions[0]).sort());
    console.log('\nSample data:');
    console.log(JSON.stringify(decisions[0], null, 2));
  } else {
    console.log('No decisions found in database');
  }

  // Check for options table
  console.log('\n\nChecking options table schema...\n');
  const { data: options, error: optionsError } = await supabase
    .from('options')
    .select('*')
    .limit(1);

  if (!optionsError && options && options.length > 0) {
    console.log('Options fields:', Object.keys(options[0]).sort());
  }

  // Check for pros_cons table
  console.log('\n\nChecking pros_cons table schema...\n');
  const { data: prosCons, error: prosConsError } = await supabase
    .from('pros_cons')
    .select('*')
    .limit(1);

  if (!prosConsError && prosCons && prosCons.length > 0) {
    console.log('Pros/Cons fields:', Object.keys(prosCons[0]).sort());
  }

  // Check for outcomes table
  console.log('\n\nChecking outcomes table schema...\n');
  const { data: outcomes, error: outcomesError } = await supabase
    .from('outcomes')
    .select('*')
    .limit(1);

  if (!outcomesError && outcomes && outcomes.length > 0) {
    console.log('Outcomes fields:', Object.keys(outcomes[0]).sort());
  }
}

checkSchema().then(() => {
  console.log('\nDone');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
