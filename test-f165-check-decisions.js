/**
 * Check decisions for test user
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDecisions() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Sign in
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'export103@test.com',
    password: 'test123456'
  });

  const userId = signInData.user.id;

  // List decisions for this user
  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('Decisions for user:');
  decisions.forEach(d => {
    console.log(`- ${d.id}: ${d.title}`);
  });

  // Check for any decisions without options
  for (const decision of decisions) {
    const { data: options } = await supabase
      .from('options')
      .select('id')
      .eq('decision_id', decision.id);

    console.log(`  Decision "${decision.title}" has ${options.length} options`);
  }
}

checkDecisions();
