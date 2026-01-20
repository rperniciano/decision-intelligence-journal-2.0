const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findTestUser() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', '%test%poll%')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log(JSON.stringify(data[0]));
  } else {
    console.log('No test user found');
  }
}

findTestUser();
