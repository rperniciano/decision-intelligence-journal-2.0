const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function confirmUserEmail() {
  // List all users to find the test user
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }

  const user = data.users.find(u => u.email === 'feature66@example.com');

  if (user) {
    console.log('Found user:', user.id);

    // Confirm the email
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (updateError) {
      console.error('Error confirming email:', updateError);
      process.exit(1);
    }

    console.log('✓ Email confirmed for feature66@example.com');
  } else {
    console.log('User feature66@example.com not found');
  }
}

confirmUserEmail();
