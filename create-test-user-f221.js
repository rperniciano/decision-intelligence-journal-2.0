// Create a confirmed test user for Feature #221 regression testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const testEmail = 'regression-test-f221@example.com';
  const testPassword = 'test123456';

  try {
    // First, try to delete the user if it exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === testEmail);

    if (existingUser) {
      console.log('Deleting existing user...');
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('Existing user deleted');
    }

    // Create a new confirmed user
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Regression Test'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      process.exit(1);
    }

    console.log('✅ Test user created successfully!');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('User ID:', data.user.id);
    console.log('Email confirmed:', data.user.email_confirmed_at);

    // Create a test decision for this user
    const { data: decision, error: decError } = await supabase
      .from('decisions')
      .insert({
        user_id: data.user.id,
        title: 'Test Decision for Feature #221',
        description: 'This decision will be deleted to test confirmation messages',
        status: 'pending',
        options: [
          { id: '1', title: 'Option A', description: 'Test option A' },
          { id: '2', title: 'Option B', description: 'Test option B' }
        ],
        pros_cons: {
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1']
        },
        emotional_state: 'neutral',
        complexity_score: 5
      })
      .select()
      .single();

    if (decError) {
      console.error('Error creating test decision:', decError);
    } else {
      console.log('✅ Test decision created!');
      console.log('Decision ID:', decision.id);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createTestUser();
