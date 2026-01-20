// Find an existing test user to login for performance testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findTestUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, id')
    .ilike('email', '%test%@%')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Found test user:');
    console.log('Email:', data[0].email);
    console.log('ID:', data[0].id);
  } else {
    console.log('No test users found');
  }
}

findTestUser();
