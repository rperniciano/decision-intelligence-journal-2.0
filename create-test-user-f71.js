// Create test user for Feature #71 testing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = `feature71-test-${Date.now()}@example.com`;
  const password = 'test123456';
  const name = 'Feature 71 Test User';

  console.log('Creating test user:', email);

  // Create user with auto-confirm
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  console.log('✅ User created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', authData.user.id);

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      name,
      decision_score: 50,
      total_decisions: 0,
      positive_outcome_rate: 0
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('✅ Profile created successfully!');
  }

  console.log('\n=================================');
  console.log('LOGIN CREDENTIALS:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('=================================');
}

createTestUser();
