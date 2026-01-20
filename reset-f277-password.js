const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = 'test_f277@example.com';
  const newPassword = 'Test1234';

  // Get user from auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', user.id);

  // Update password
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword
  });

  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('Password updated successfully!');
    console.log('Email:', email);
    console.log('Password:', newPassword);
  }
}

main().catch(console.error);
