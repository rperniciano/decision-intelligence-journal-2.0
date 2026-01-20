// Create a test decision for Feature #221 regression testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestDecision() {
  const testEmail = 'regression-test-f221@example.com';
  const testPassword = 'test123456';

  try {
    // Sign in to get the session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      process.exit(1);
    }

    console.log('✅ Signed in successfully!');
    console.log('User ID:', signInData.user.id);

    // Create a test decision
    const { data: decision, error: decError } = await supabase
      .from('decisions')
      .insert({
        user_id: signInData.user.id,
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
        detected_emotional_state: 'neutral'
      })
      .select()
      .single();

    if (decError) {
      console.error('Error creating test decision:', decError);
      process.exit(1);
    }

    console.log('✅ Test decision created!');
    console.log('Decision ID:', decision.id);
    console.log('Title:', decision.title);

    // Create another test decision to have more than one
    const { data: decision2, error: decError2 } = await supabase
      .from('decisions')
      .insert({
        user_id: signInData.user.id,
        title: 'Another Test Decision',
        description: 'This will remain after testing',
        status: 'pending',
        options: [
          { id: '1', title: 'Option X', description: 'Test option X' }
        ],
        pros_cons: {
          pros: ['Pro X'],
          cons: []
        },
        detected_emotional_state: 'confident'
      })
      .select()
      .single();

    if (decError2) {
      console.error('Error creating second test decision:', decError2);
    } else {
      console.log('✅ Second test decision created!');
      console.log('Decision ID:', decision2.id);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createTestDecision();
