// Create test user for Feature #276 with decisions containing nested data
const Database = require('better-sqlite3');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestData() {
  console.log('=== Creating test data for Feature #276 ===\n');

  // 1. Create user
  const email = 'test_f276@example.com';
  const password = 'password123';

  console.log('Step 1: Creating user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error('Error signing up:', signUpError);
    return;
  }

  // Get session - either from signup or sign in
  let session;
  if (signUpError && signUpError.message.includes('already registered')) {
    console.log('User already exists, signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error('Error signing in:', signInError);
      return;
    }
    session = signInData.session;
  } else {
    session = signUpData.session;
    console.log('✓ User created');
  }

  // Set session for subsequent requests
  supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  // 2. Get user ID
  const userId = session.user.id;
  console.log('✓ User ID:', userId);

  // 3. Create category
  console.log('\nStep 2: Creating category...');
  const { data: category } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'Career',
      icon: 'briefcase',
      color: '#00d4aa'
    })
    .select()
    .single();

  console.log('✓ Category created:', category.id);

  // 4. Create decision with COMPLETE nested data
  console.log('\nStep 3: Creating decision with nested data...');

  const { data: decision } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F276_TEST: Job Offer Decision',
      description: 'Should I accept the new job offer?',
      status: 'decided',
      category_id: category.id,
      decided_at: new Date().toISOString(),
      decide_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      emotional_state: 'neutral',
      confidence_level: 7,
      outcome_satisfaction: 8,
      outcome_notes: 'Great decision, salary increased by 40%',
      outcome_recorded_at: new Date().toISOString()
    })
    .select()
    .single();

  console.log('✓ Decision created:', decision.id);

  // 5. Create options with pros/cons
  console.log('\nStep 4: Creating options with pros/cons...');

  // Option 1: Accept the offer
  const { data: option1 } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'Accept the offer',
      is_chosen: true,
      notes: 'Higher salary, better benefits'
    })
    .select()
    .single();

  console.log('✓ Option 1 created:', option1.id);

  // Pros for option 1
  await supabase.from('pros_cons').insert([
    { option_id: option1.id, type: 'pro', content: '40% salary increase' },
    { option_id: option1.id, type: 'pro', content: 'Better health insurance' },
    { option_id: option1.id, type: 'pro', content: 'Remote work flexibility' },
  ]);
  console.log('  ✓ Added 3 pros');

  // Cons for option 1
  await supabase.from('pros_cons').insert([
    { option_id: option1.id, type: 'con', content: 'Longer commute' },
    { option_id: option1.id, type: 'con', content: 'New team to learn' },
  ]);
  console.log('  ✓ Added 2 cons');

  // Option 2: Stay at current job
  const { data: option2 } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'Stay at current job',
      is_chosen: false,
      notes: 'Familiar environment'
    })
    .select()
    .single();

  console.log('✓ Option 2 created:', option2.id);

  // Pros for option 2
  await supabase.from('pros_cons').insert([
    { option_id: option2.id, type: 'pro', content: 'Familiar team' },
    { option_id: option2.id, type: 'pro', content: 'Short commute' },
  ]);
  console.log('  ✓ Added 2 pros');

  // Cons for option 2
  await supabase.from('pros_cons').insert([
    { option_id: option2.id, type: 'con', content: 'Lower salary' },
    { option_id: option2.id, type: 'con', content: 'Limited growth opportunities' },
    { option_id: option2.id, type: 'con', content: 'No remote work option' },
  ]);
  console.log('  ✓ Added 3 cons');

  // 6. Create reminder
  console.log('\nStep 5: Creating reminder...');
  const { data: reminder } = await supabase
    .from('reminders')
    .insert({
      decision_id: decision.id,
      remind_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  console.log('✓ Reminder created:', reminder.id);

  // 7. Summary
  console.log('\n=== Test Data Created Successfully ===');
  console.log('User:', email);
  console.log('Password:', password);
  console.log('');
  console.log('Data structure:');
  console.log('  - 1 decision (with outcome)');
  console.log('  - 1 category');
  console.log('  - 2 options (1 chosen, 1 not chosen)');
  console.log('  - 10 pros/cons (5 pros, 5 cons)');
  console.log('  - 1 reminder');
  console.log('');
  console.log('This decision has ALL nested data needed for Feature #276 testing!');
}

createTestData().catch(console.error);
