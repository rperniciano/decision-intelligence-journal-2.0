import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmUserByEmail() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error);
    return;
  }

  const user = users.find(u => u.email === 'networktest105@example.com');
  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Found user:', user.id);

  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('Error confirming user:', updateError);
  } else {
    console.log('User confirmed successfully!');
  }
}

confirmUserByEmail();
