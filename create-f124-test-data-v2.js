// Create test decision for Feature #124 testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('Creating test decision for Feature #124...');

  try {
    // Get existing user
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'test_f124_delete@example.com')
      .single();

    if (userError || !existingUser) {
      console.log('User not found, creating new user...');

      // Create new user with different email
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'testf124@example.com',
        password: 'Test1234!',
        email_confirm: true,
        user_metadata: { name: 'Test User F124' }
      });

      if (createError) throw createError;
      var userId = newUser.user.id;
      console.log('Created new user:', userId);
      console.log('- Email: testf124@example.com');
      console.log('- Password: Test1234!');
    } else {
      var userId = existingUser.id;
      console.log('Found existing user:', userId);
      console.log('- Email: test_f124_delete@example.com');
      console.log('- Password: Test1234!');
    }

    // Create a test decision to delete
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: 'Decision to Delete - F124',
        description: 'This decision will be deleted to test the delete endpoint',
        status: 'draft'
      })
      .select()
      .single();

    if (decisionError) throw decisionError;

    console.log('\nCreated test decision:');
    console.log('- Decision ID:', decision.id);
    console.log('- Decision Title:', decision.title);
    console.log('\nYou can now log in and test the delete functionality!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestData();
