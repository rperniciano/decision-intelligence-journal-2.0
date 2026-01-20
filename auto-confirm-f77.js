import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function autoConfirmUser() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    'USER_ID_HERE', // Need to get this first
    { email_confirm: true }
  );
  console.log('User auto-confirmed:', data);
}

// First, let's try to get the user by email
async function confirmUserByEmail() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error);
    return;
  }

  const user = users.find(u => u.email === 'feature77-test@example.com');
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
