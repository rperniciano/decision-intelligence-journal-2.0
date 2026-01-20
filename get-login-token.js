const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test123456'
  });

  if (error) {
    console.log('Login error:', error.message);
    return;
  }

  console.log(data.session.access_token);
}

login();
