// Directly insert a decision to test Feature #221
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertTestDecision() {
  try {
    // Get the test user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const testUser = users.find(u => u.email === 'regression-test-f221@example.com');

    if (!testUser) {
      throw new Error('Test user not found');
    }

    console.log('Found test user:', testUser.id);

    // Insert a decision
    const { data: decision, error } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: 'Test Delete Confirmation Feature #221',
        description: 'This decision will be deleted to test the success message',
        status: 'decided',
        detected_emotional_state: 'confident'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Test decision created!');
    console.log('   Decision ID:', decision.id);
    console.log('   Title:', decision.title);
    console.log('\nNavigate to: http://localhost:5173/decisions/' + decision.id);
    console.log('Then click Delete and verify the success message appears.');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

insertTestDecision();
