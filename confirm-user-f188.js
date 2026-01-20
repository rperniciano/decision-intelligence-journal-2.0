const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUser() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error);
    return;
  }

  const user = data.users.find(u => u.email === 'test-f188@example.com');
  if (user) {
    console.log('Found user:', user.id);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: { name: 'Test User F188' }
    });

    if (updateError) {
      console.error('Error confirming:', updateError);
    } else {
      console.log('User confirmed successfully!');
    }
  } else {
    console.log('User not found');
  }
}

confirmUser();
