const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc'
);

async function createTestUser() {
  const timestamp = Date.now();
  const email = `feature46-test-${timestamp}@example.com`;

  console.log('Creating test user:', email);

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: 'password123',
    options: {
      data: {
        name: 'Feature 46 Test User'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('User created successfully!');
  console.log('Email:', email);
  console.log('Password: password123');
  console.log('User ID:', data.user?.id);
  console.log('Confirmed:', data.user?.confirmed_at ? 'YES' : 'NO - needs confirmation');
}

createTestUser();
