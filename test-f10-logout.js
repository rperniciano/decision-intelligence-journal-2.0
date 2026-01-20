// Create test user for Feature #10 logout test

async function createTestUser() {
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config();

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const testEmail = `f10-logout-test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  console.log('Creating test user:', testEmail);

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: 'F10 Logout Test User'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('✅ Test user created successfully');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('User ID:', data.user?.id);

  return { email: testEmail, password: testPassword, userId: data.user?.id };
}

createTestUser().then(credentials => {
  console.log('\n=== CREDENTIALS FOR COPY/PASTE ===');
  console.log(`Email: ${credentials.email}`);
  console.log(`Password: ${credentials.password}`);
});
