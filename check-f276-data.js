// Check if test user for F276 already has data
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('=== Checking existing data for test_f276@example.com ===\n');

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test_f276@example.com',
    password: 'password123',
  });

  if (signInError) {
    console.error('Error signing in:', signInError.message);
    return;
  }

  console.log('✓ Signed in successfully');

  // Set session
  supabase.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });

  const userId = signInData.session.user.id;
  console.log('✓ User ID:', userId);

  // Check for decisions
  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('id, title, status')
    .eq('user_id', userId);

  if (decisionsError) {
    console.error('Error fetching decisions:', decisionsError);
  } else {
    console.log('\n✓ Decisions found:', decisions.length);
    decisions.forEach(d => {
      console.log(`  - ${d.title} (${d.status})`);
    });
  }

  // Check for one decision with full nested data
  if (decisions && decisions.length > 0) {
    console.log('\nFetching first decision with nested data...');
    const { data: fullDecision, error: fullError } = await supabase
      .from('decisions')
      .select(`
        id,
        title,
        status,
        category_id,
        outcome_notes,
        options (
          id,
          title,
          is_chosen,
          pros_cons (
            id,
            type,
            content
          )
        )
      `)
      .eq('id', decisions[0].id)
      .single();

    if (fullError) {
      console.error('Error fetching full decision:', fullError);
    } else {
      console.log('\n✓ Full decision data:');
      console.log('  Title:', fullDecision.title);
      console.log('  Status:', fullDecision.status);
      console.log('  Has category:', !!fullDecision.category_id);
      console.log('  Has outcome:', !!fullDecision.outcome_notes);
      console.log('  Options:', fullDecision.options?.length || 0);

      if (fullDecision.options) {
        fullDecision.options.forEach(opt => {
          console.log(`    - ${opt.title} (chosen: ${opt.is_chosen})`);
          console.log(`      Pros/Cons: ${opt.pros_cons?.length || 0}`);
        });
      }
    }
  }
}

checkData().catch(console.error);
