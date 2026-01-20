const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisions() {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, user_id')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Found decision:', data[0].id, data[0].title);
    console.log('User ID:', data[0].user_id);
  } else {
    console.log('No decisions found');
  }
}

checkDecisions().then(() => process.exit(0));
