const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestData() {
  console.log('Creating test data for Feature #279...');

  // Create or get test user
  const email = 'test_f279_filtered_export@example.com';
  const password = 'Test1234!';

  // Try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  let userId;
  if (signUpError && signUpError.message.includes('already registered')) {
    // User already exists, sign in
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    userId = signInData.user.id;
    console.log('✓ Signed in existing user:', userId);
  } else {
    userId = signUpData.user.id;
    console.log('✓ Created new user:', userId);
  }

  // Get or create categories
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  let careerCat, personalCat, financeCat;

  if (existingCategories && existingCategories.length > 0) {
    careerCat = existingCategories.find(c => c.name === 'Career');
    personalCat = existingCategories.find(c => c.name === 'Personal');
    financeCat = existingCategories.find(c => c.name === 'Finance');
  }

  if (!careerCat) {
    const { data } = await supabase
      .from('categories')
      .insert([{ user_id: userId, name: 'Career', slug: 'career' }])
      .select()
      .single();
    careerCat = data;
  }

  if (!personalCat) {
    const { data } = await supabase
      .from('categories')
      .insert([{ user_id: userId, name: 'Personal', slug: 'personal' }])
      .select()
      .single();
    personalCat = data;
  }

  if (!financeCat) {
    const { data } = await supabase
      .from('categories')
      .insert([{ user_id: userId, name: 'Finance', slug: 'finance' }])
      .select()
      .single();
    financeCat = data;
  }

  console.log('✓ Categories:', { career: careerCat.id, personal: personalCat.id, finance: financeCat.id });

  // Create minimal decisions across different categories
  const decisions = [
    {
      title: 'F279_TEST: Career Decision 1',
      status: 'decided',
      category_id: careerCat.id,
      decided_at: new Date().toISOString(),
    },
    {
      title: 'F279_TEST: Career Decision 2',
      status: 'in_progress',
      category_id: careerCat.id,
    },
    {
      title: 'F279_TEST: Personal Decision 1',
      status: 'draft',
      category_id: personalCat.id,
    },
    {
      title: 'F279_TEST: Finance Decision 1',
      status: 'decided',
      category_id: financeCat.id,
      decided_at: new Date().toISOString(),
    },
    {
      title: 'F279_TEST: Finance Decision 2',
      status: 'draft',
      category_id: financeCat.id,
    },
  ];

  // Insert decisions
  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert([{
        user_id: userId,
        ...decision,
      }])
      .select()
      .single();

    if (error) {
      console.error('✗ Error creating decision:', error.message);
    } else {
      console.log(`✓ Created decision: ${decision.title}`);
    }
  }

  console.log('\n=== Test Data Created ===');
  console.log(`User: ${email}`);
  console.log(`Password: ${password}`);
  console.log('Total decisions: 5');
  console.log('  - Career: 2 decisions');
  console.log('  - Personal: 1 decision');
  console.log('  - Finance: 2 decisions');
  console.log('\nYou can now test filtering by category and exporting.');
}

createTestData().catch(console.error);
