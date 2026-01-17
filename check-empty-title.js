const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDecision() {
  const decisionId = '118a1d9b-fe1d-4665-9b9a-7d94df8d1459';

  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, title, status')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title === '' ? '(EMPTY STRING)' : decision.title);
  console.log('Title is null:', decision.title === null);
  console.log('Title length:', decision.title?.length || 0);
  console.log('Status:', decision.status);
}

checkDecision();
