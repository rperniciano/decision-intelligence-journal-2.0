const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupTestUser() {
  try {
    // Create user with email confirmation
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'testf159@example.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        name: 'Test User F159'
      }
    });

    if (userError) {
      // User might already exist, try to get it
      console.log('User might already exist, attempting to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'testf159@example.com',
        password: 'test123456'
      });

      if (signInError) throw signInError;

      console.log('✓ User signed in successfully');
      console.log('User ID:', signInData.user.id);
      console.log('Access Token:', signInData.session.access_token);
      return;
    }

    console.log('✓ User created successfully');
    console.log('Email: testf159@example.com');
    console.log('Password: test123456');
    console.log('User ID:', userData.user.id);
    console.log('');
    console.log('You can now sign in with these credentials');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupTestUser();
