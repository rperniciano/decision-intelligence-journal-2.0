const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function confirmUserEmail() {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }

  const user = data.users.find(u => u.email === 'f206test@example.com');

  if (user) {
    console.log('Found user:', user.id);

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (updateError) {
      console.error('Error confirming email:', updateError);
      process.exit(1);
    }

    console.log('✓ Email confirmed for f206test@example.com');
  } else {
    console.log('User f206test@example.com not found');
  }
}

confirmUserEmail();
