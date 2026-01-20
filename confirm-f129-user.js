// Confirm email for f129-test-regression user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    const email = 'f129-test-regression@example.com';

    // Get existing user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingUser = users.find(u => u.email === email);

    if (!existingUser) {
      console.error('User not found');
      return;
    }

    // Update user to confirm email
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Error confirming email:', updateError);
      return;
    }

    console.log(`✅ Email confirmed for: ${email}`);
    console.log('You can now login with:');
    console.log(`Email: ${email}`);
    console.log('Password: test123456');

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
