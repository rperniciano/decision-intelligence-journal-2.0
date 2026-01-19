/**
 * Create test user for Feature #269 testing
 * Using Supabase directly to bypass email confirmation
 */
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    console.log('Creating test user for Feature #269...');

    // Create user with auth.admin API to skip email confirmation
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test_f269@example.com',
      password: 'testpass123',
      options: {
        data: {
          name: 'Test F269',
        },
        emailRedirectTo: undefined,
      }
    });

    if (signUpError) {
      // User might already exist, try to sign in instead
      console.log('User might already exist, attempting to sign in...');

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test_f269@example.com',
        password: 'testpass123',
      });

      if (signInError) {
        console.error('Sign in failed:', signInError);
        throw signInError;
      }

      console.log('✓ Successfully signed in existing user');
      console.log('User ID:', signInData.user.id);
      return;
    }

    if (signUpData.user) {
      console.log('✓ Successfully created test user');
      console.log('User ID:', signUpData.user.id);
      console.log('Email:', signUpData.user.email);

      // Auto-confirm the user by updating in database
      // (This requires service role key, but let's try with anon key first)
      console.log('Note: User may need email confirmation for first login');
    }

  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

createTestUser()
  .then(() => {
    console.log('\nTest user setup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nFailed to create test user');
    process.exit(1);
  });
