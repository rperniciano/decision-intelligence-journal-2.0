const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, audio_url')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample decisions with audio_url:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkSchema();
