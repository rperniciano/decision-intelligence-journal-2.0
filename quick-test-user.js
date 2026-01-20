const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass email verification
const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

async function createTestUser() {
  const email = 'feature74-test-' + Date.now() + '@example.com';
  const password = 'test123456';

  console.log('Creating test user...');
  console.log('Email:', email);
  console.log('Password:', password);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'Feature 74 Tester'
    }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n✅ User created successfully!');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  console.log('\nYou can now sign in with these credentials.');
}

createTestUser();
