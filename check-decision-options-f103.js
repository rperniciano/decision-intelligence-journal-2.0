const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDecisionOptions() {
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'export103@test.com',
    password: 'test123456',
  });

  const userId = signInData.user.id;

  // Get decision with options
  const { data: decisions } = await supabase
    .from('decisions')
    .select(`
      id,
      title,
      status,
      options (
        id,
        title
      )
    `)
    .eq('user_id', userId);

  console.log('Decisions:', JSON.stringify(decisions, null, 2));
}

checkDecisionOptions();
