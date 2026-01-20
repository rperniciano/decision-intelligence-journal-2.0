const supabase = require('./apps/api/src/lib/supabase');

async function createTestUser() {
  const email = 'f286-console-test@example.com';
  const password = 'Test123456';

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('User already exists:', existingUser);
      return;
    }

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Created test user:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', authData.user?.id);

  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
