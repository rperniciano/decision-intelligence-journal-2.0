const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setPassword() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email.includes('regression213'));

  if (!testUser) {
    console.log('User not found. Creating...');

    // Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'regression213@test.com',
      password: 'password123',
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('Created user: regression213@test.com with password: password123');
    }
  } else {
    console.log('User exists: regression213@test.com');
    console.log('You can reset the password via the forgot password flow');
    console.log('Or update the password directly in Supabase dashboard');
  }
}

setPassword().catch(console.error);
