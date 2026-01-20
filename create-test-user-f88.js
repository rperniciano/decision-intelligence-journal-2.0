import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  const timestamp = Date.now();
  const email = `f88-test-${timestamp}@example.com`;
  const password = 'Test1234!';
  const name = 'Test User F88';

  // Create user with email_confirmed at set to now
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log('User created:', email);
  console.log('User ID:', data.user.id);
  console.log('Email confirmed:', data.user.email_confirmed_at);

  // Create profile entry
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      name: name
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Profile created successfully');
  }

  return { email, password, userId: data.user.id };
}

createTestUser().catch(console.error);
