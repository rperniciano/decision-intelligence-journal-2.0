import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser() {
  try {
    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.find(u => u.email === 'session62test@example.com');

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.id, user.email);

    // Update user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirmed_at: new Date().toISOString() }
    );

    if (error) {
      console.error('Error confirming user:', error);
    } else {
      console.log('User confirmed successfully!', data.user.email);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

confirmUser();
