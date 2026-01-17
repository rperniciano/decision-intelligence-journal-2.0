const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecision() {
  const { data, error } = await supabase
    .from('decisions')
    .select('*, options!options_decision_id_fkey(*), categories(name)')
    .eq('id', '2d486351-1bda-4f54-96df-de58edc33072')
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Decision:', JSON.stringify(data, null, 2));
  }
}

checkDecision();
