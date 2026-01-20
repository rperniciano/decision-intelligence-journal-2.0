const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  // First, get or create a test user
  const testEmail = 'f87-regression-test@example.com';

  // Try to get existing user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.log('Error listing users:', listError.message);
    return;
  }

  const existingUser = users.find(u => u.email === testEmail);
  let userId;

  if (existingUser) {
    console.log('Found existing user:', existingUser.id);
    userId = existingUser.id;
  } else {
    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true,
      user_metadata: { name: 'F87 Regression Test' }
    });

    if (createError) {
      console.log('Error creating user:', createError.message);
      return;
    }
    userId = newUser.user.id;
    console.log('Created new user:', userId);
  }

  // Create a deliberating decision
  const decisionData = {
    user_id: userId,
    title: 'F87 Test Decision: Which job offer should I take?',
    description: 'I have two job offers and need to decide',
    status: 'in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (decisionError) {
    console.log('Error creating decision:', decisionError.message);
    return;
  }

  console.log('\n✅ Test decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
  console.log('\nTest credentials:');
  console.log('Email:', testEmail);
  console.log('Password: test123456');
}

createTestDecision();
