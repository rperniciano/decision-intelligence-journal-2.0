const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDecision() {
  const timestamp = new Date().toISOString();
  const uniqueTitle = `F52_Regression_Test_${timestamp}`;

  // First create a new user
  const email = `f52-test-${Date.now()}@example.com`;
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password: 'Test123456!',
    email_confirm: true,
    user_metadata: { name: 'F52 Test User' }
  });

  if (userError) {
    console.error('Error creating user:', userError);
    process.exit(1);
  }

  const userId = userData.user.id;
  console.log(`✅ Test user created: ${email}`);
  console.log('User ID:', userId);

  // Now create the decision
  const decision = {
    user_id: userId,
    title: uniqueTitle,
  };

  const { data, error } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (error) {
    console.error('Error creating test decision:', error);
    process.exit(1);
  }

  console.log('\n✅ Test decision created successfully!');
  console.log('ID:', data.id);
  console.log('Title:', data.title);
  console.log('\nLogin credentials:');
  console.log(`Email: ${email}`);
  console.log('Password: Test123456!');
  console.log('\nThis decision will be used to verify persistence after page refresh.');
  return { decision, email };
}

createTestDecision()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
