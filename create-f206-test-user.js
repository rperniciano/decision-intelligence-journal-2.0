import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = 'test_f206@example.com';
  const password = 'Test1234!';

  console.log('Creating test user for Feature #206...');

  // Create user with auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  console.log('✅ User created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);

  if (authData.user) {
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: 'F206 Test User',
      });

    if (profileError) {
      console.error('Profile error:', profileError.message);
    } else {
      console.log('✅ Profile created successfully!');
    }
  }
}

createTestUser().catch(console.error);
