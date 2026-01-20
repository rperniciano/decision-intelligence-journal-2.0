const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findDecisions() {
  // Try to get any decision to see the schema
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error fetching decisions:', error.message);
    return;
  }

  if (decisions && decisions.length > 0) {
    console.log('Found decision. Columns:');
    console.log(Object.keys(decisions[0]));
    console.log('\nSample:');
    console.log(JSON.stringify(decisions[0], null, 2));
  } else {
    console.log('No decisions found in database');

    // Try getting a user to work with
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const testUser = users.find(u => u.email.includes('test'));

    if (testUser) {
      console.log('\nFound test user:', testUser.email);
      console.log('User ID:', testUser.id);
    }
  }
}

findDecisions();
