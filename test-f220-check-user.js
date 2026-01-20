const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkUser() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const users = [
    { email: 'test_f220@example.com', password: 'Test1234!' },
    { email: 'test@example.com', password: 'test123456' },
    { email: 'feature220@example.com', password: 'test123456' },
  ];

  for (const user of users) {
    try {
      console.log(`Trying ${user.email}...`);
      const { data, error } = await supabase.auth.signInWithPassword(user);
      if (data.session) {
        console.log(`✓ SUCCESS: ${user.email} is valid!`);
        console.log('  User ID:', data.session.user.id);
        process.exit(0);
      } else {
        console.log(`  ✗ Failed: ${error?.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.log(`  ✗ Error: ${e.message}`);
    }
  }

  console.log('\nNo valid test user found');
  process.exit(1);
}

checkUser();
