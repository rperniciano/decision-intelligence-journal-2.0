require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getFeature18() {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('id', 18)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Feature #18:');
  console.log(JSON.stringify(data, null, 2));
}

getFeature18();
