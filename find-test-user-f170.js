const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function findTestUser() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', 'test%example.com')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Found test user:', data[0].email);
  } else {
    console.log('No test user found');
  }
}

findTestUser();
