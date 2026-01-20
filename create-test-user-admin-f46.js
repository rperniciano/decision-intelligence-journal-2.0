const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass RLS and auto-confirm
const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

async function createAndConfirmUser() {
  const timestamp = Date.now();
  const email = `feature46-test-${timestamp}@example.com`;

  console.log('Creating test user with admin privileges:', email);

  // Create user with auto-confirm
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      name: 'Feature 46 Test User'
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('✅ User created and auto-confirmed!');
  console.log('📧 Email:', email);
  console.log('🔑 Password: password123');
  console.log('🆔 User ID:', data.user?.id);
  console.log('✅ Confirmed:', data.user?.confirmed_at ? 'YES' : 'NO');
}

createAndConfirmUser();
