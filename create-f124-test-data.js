// Create test user and decision for Feature #124 testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('Creating test data for Feature #124...');

  try {
    // Create user using admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test_f124_delete@example.com',
      password: 'Test1234!',
      email_confirm: true,
      user_metadata: { name: 'Test User F124' }
    });

    if (userError) {
      // User might already exist, try to get existing user
      console.log('User might exist, trying to get existing user...');
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'test_f124_delete@example.com')
        .single();

      if (existingUser) {
        console.log('Found existing user:', existingUser.id);
        var userId = existingUser.id;
      } else {
        throw userError;
      }
    } else {
      console.log('Created user:', userData.user.id);
      var userId = userData.user.id;
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

    console.log('Created test decision:', decision.id);
    console.log('\nTest data ready:');
    console.log('- Email: test_f124_delete@example.com');
    console.log('- Password: Test1234!');
    console.log('- Decision ID:', decision.id);
    console.log('- Decision Title:', decision.title);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestData();
