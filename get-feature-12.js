const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getFeature12() {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('id', 12)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Feature #12:');
  console.log(JSON.stringify(data, null, 2));
}

getFeature12();
