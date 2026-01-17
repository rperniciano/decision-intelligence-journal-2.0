const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  const { data } = await supabase
    .from('decisions')
    .select('status')
    .limit(10);

  if (data) {
    const statuses = [...new Set(data.map(d => d.status))];
    console.log('Found status values:', statuses);
  }
}

checkStatus();
