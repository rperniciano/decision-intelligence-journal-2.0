// Quick script to confirm the test user for Feature #272 testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function confirmUser() {
  const userEmail = 'feature272.test@example.com';

  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === userEmail);

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Found user:', user.id);

  // Update user email confirmed
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });

  if (error) {
    console.error('Error confirming user:', error);
  } else {
    console.log('✅ User confirmed successfully');
    console.log('Email:', userEmail);
    console.log('User ID:', user.id);
  }
}

confirmUser();
