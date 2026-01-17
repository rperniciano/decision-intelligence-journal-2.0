const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const email = 'emptyuser@example.com';
  const password = 'password123';

  const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: 'Empty User'
    }
  });

  if (signUpError) {
    console.log('Error creating user:', signUpError.message);
  } else {
    console.log('User created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', signUpData.user.id);
  }
})();
