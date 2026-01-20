const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function findUser() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log(data[0].email);
  } else {
    console.log('No users found');
  }
}

findUser();
