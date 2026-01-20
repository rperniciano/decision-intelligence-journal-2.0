const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkTestUser() {
  // Check for existing test user
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'test_f124_delete@example.com')
    .single();

  if (user) {
    console.log('Found test user:', user.id);

    // Count decisions
    const { data: decisions } = await supabase
      .from('decisions')
      .select('id, title')
      .eq('user_id', user.id);

    console.log('Decisions count:', decisions?.length || 0);
    if (decisions && decisions.length > 0) {
      console.log('Sample decision:', decisions[0]);
    }
  } else {
    console.log('No test user found');
  }
}

checkTestUser();
