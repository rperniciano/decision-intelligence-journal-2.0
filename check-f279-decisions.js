const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDecisions() {
  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test_f279_filtered_export@example.com',
    password: 'Test1234!',
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  console.log('User ID:', signInData.user.id);

  // Check decisions directly from Supabase
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', signInData.user.id);

  if (error) {
    console.error('Error fetching decisions:', error);
  } else {
    console.log('Decisions count:', decisions.length);
    decisions.forEach(d => {
      console.log(`- ${d.title} (${d.status})`);
    });
  }
}

checkDecisions().catch(console.error);
