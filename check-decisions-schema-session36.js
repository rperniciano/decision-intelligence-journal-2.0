const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisionsSchema() {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample decision data:', JSON.stringify(data, null, 2));
    if (data.length > 0) {
      console.log('\nSchema fields:', Object.keys(data[0]));
    }
  }
}

checkDecisionsSchema();
