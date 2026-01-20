const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

(async () => {
  // Try to find the user
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  const user = users.find(u => u.email === 'feature200.test@example.com');

  if (user) {
    console.log('User ID:', user.id);
    // Confirm the user
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
    if (updateError) {
      console.error('Error confirming:', updateError.message);
    } else {
      console.log('User confirmed successfully!');
    }
  } else {
    console.log('User not found');
  }
})();
