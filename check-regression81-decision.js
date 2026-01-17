const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDecision() {
  const decisionId = '118a1d9b-fe1d-4665-9b9a-7d94df8d1459';

  // Get decision details
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decisionId)
    .single();

  console.log('Decision:', decision?.title);

  // Get options
  const { data: options } = await supabase
    .from('decision_options')
    .select('*')
    .eq('decision_id', decisionId);

  console.log('Options count:', options?.length || 0);
  if (options?.length > 0) {
    options.forEach(opt => console.log('  -', opt.title));
  }

  // Get pros/cons
  const { data: proscons } = await supabase
    .from('pros_cons')
    .select('*')
    .eq('decision_id', decisionId);

  console.log('Pros/Cons count:', proscons?.length || 0);
  if (proscons?.length > 0) {
    proscons.forEach(pc => console.log('  -', pc.type, ':', pc.text));
  }
}

checkDecision();
