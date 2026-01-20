const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testF61Regression() {
  const timestamp = Date.now();
  const email = `f61-regression-${timestamp}@example.com`;
  const password = 'test123456';

  console.log('Creating test user for Feature #61 regression...');
  console.log('Email:', email);
  console.log('Password:', password);

  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'F61 Test User' }
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  const userIdToUse = authData.user.id;

  console.log('\n✓ User created successfully');
  console.log('\nTest credentials:');
  console.log('Email:', email);
  console.log('Password:', password);

  // Create two test decisions with outcomes
  const decision1 = await supabase
    .from('decisions')
    .insert({
      user_id: userIdToUse,
      title: 'DECISION_A_TEST_F61',
      status: 'decided'
    })
    .select()
    .single();

  if (decision1.error) {
    console.error('Error creating decision1:', decision1.error);
  } else {
    console.log('Created DECISION_A with ID:', decision1.data.id);
  }

  const decision2 = await supabase
    .from('decisions')
    .insert({
      user_id: userIdToUse,
      title: 'DECISION_B_TEST_F61',
      status: 'decided'
    })
    .select()
    .single();

  if (decision2.error) {
    console.error('Error creating decision2:', decision2.error);
  } else {
    console.log('Created DECISION_B with ID:', decision2.data.id);
  }

  // Create outcome only for DECISION_A
  const outcome = await supabase
    .from('outcomes')
    .insert({
      decision_id: decision1.data.id,
      result: 'better',
      satisfaction: 4
    })
    .select()
    .single();

  if (outcome.error) {
    console.error('Error creating outcome:', outcome.error);
  } else {
    console.log('Created outcome for DECISION_A');
  }

  console.log('\n✓ Test data ready for Feature #61 regression');
}

testF61Regression();
