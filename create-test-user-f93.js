const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createConfirmedUser() {
  const email = 'test93-func@example.com';
  const password = 'TestPassword123!';

  // Try to sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!signInError && signInData.session) {
    console.log('Session token:', signInData.session.access_token);
    console.log('User ID:', signInData.user.id);
    return;
  }

  // If sign in fails, try to sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Test User F93'
      }
    }
  });

  if (error) {
    console.log('Error:', error.message);
    process.exit(1);
  }

  console.log('Session token:', data.session.access_token);
  console.log('User ID:', data.user.id);
}

createConfirmedUser();
