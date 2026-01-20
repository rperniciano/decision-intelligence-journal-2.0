const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Use service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function confirmUser() {
  try {
    // List users to find the test user
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log('Error listing users:', error.message);
      return;
    }

    const testUser = users.find(u => u.email === 'f72-trash-test@example.com');

    if (!testUser) {
      console.log('User not found, creating...');

      // Create and auto-confirm user
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: 'f72-trash-test@example.com',
        password: 'test123456',
        email_confirm: true,
        user_metadata: { name: 'F72 Trash Test' }
      });

      if (createError) {
        console.log('Error creating user:', createError.message);
      } else {
        console.log('User created and confirmed:', data.user.id);
      }
    } else {
      console.log('User found:', testUser.id);
      console.log('Email confirmed:', testUser.confirmed_at);

      if (!testUser.confirmed_at) {
        // Update user to confirm email
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          testUser.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.log('Error confirming user:', updateError.message);
        } else {
          console.log('User email confirmed!');
        }
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

confirmUser();
