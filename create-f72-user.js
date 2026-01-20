const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'f72-trash-test@example.com',
    password: 'test123456',
    options: {
      data: { name: 'F72 Trash Test' }
    }
  });

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('User ID:', data.user?.id);
    console.log('Email confirmed:', !!data.user?.confirmed_at);
    console.log('Check email for confirmation link');
  }
}

createUser();
