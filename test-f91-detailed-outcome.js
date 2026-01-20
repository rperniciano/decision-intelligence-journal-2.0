// Test Feature #91: Record detailed outcome with rating
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDetailedOutcome() {
  const email = 'sessionf91@example.com';
  const password = 'test123456';
  const apiUrl = 'http://localhost:4001';

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  const token = signInData.session.access_token;
  const userId = signInData.user.id;
  console.log('✅ Signed in successfully');

  // Get a category
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  const categoryId = categories?.[0]?.id;

  // Create a decided decision with options
  console.log('\n=== Creating test decision ===');
  const { data: decision, error: createError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for F91',
      status: 'decided',
      category_id: categoryId,
    })
    .select()
    .single();

  if (createError) {
    console.error('Failed to create decision:', createError);
    return;
  }

  console.log('✅ Decision created:', decision.id);

  // Add options
  const { data: option1 } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'Option A',
      is_chosen: true,
      display_order: 0,
    })
    .select()
    .single();

  const { data: option2 } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'Option B',
      is_chosen: false,
      display_order: 1,
    })
    .select()
    .single();

  console.log('✅ Options created');
  console.log('\nDecision ID:', decision.id);
  console.log('Navigate to: http://localhost:5173/decisions/' + decision.id);
  console.log('\nManual steps to verify Feature #91:');
  console.log('1. Click "Record Outcome" button');
  console.log('2. Select result (Better/As Expected/Worse)');
  console.log('3. Select satisfaction rating (1-5 stars)');
  console.log('4. Add optional notes');
  console.log('5. Save');
  console.log('6. Verify outcome is recorded correctly');
}

testDetailedOutcome().catch(console.error);
