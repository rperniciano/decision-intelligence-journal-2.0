// Create a complete test decision for Feature #91
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc'
);

async function createCompleteDecision() {
  console.log('Creating complete test decision for Feature #91...');

  // First, sign in to get the user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test91-verification@example.com',
    password: 'TestPass123!'
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  const userId = signInData.user.id;
  console.log('Signed in as:', userId);

  // Delete the incomplete test decision first
  const { error: deleteError } = await supabase
    .from('decisions')
    .delete()
    .eq('title', 'F91_TEST_DECISION: Job Offer Decision')
    .eq('user_id', userId);

  if (deleteError) {
    console.log('Delete error (may not exist yet):', deleteError.message);
  }

  // Create a complete decision with description
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F91_TEST_DECISION: Job Offer Decision',
      description: 'Received a job offer from a tech company with better pay but longer commute.',
      status: 'decided',
      detected_emotional_state: 'excited',
      emotional_confidence: 0.85,
      decided_at: new Date().toISOString(),
      hour_of_day: 14,
      day_of_week: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Decision error:', decisionError);
    return;
  }

  console.log('Decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);

  console.log('\n========================================');
  console.log('Test decision ready for Feature #91');
  console.log('========================================');
  console.log('Navigate to: http://localhost:5173/decisions/' + decision.id);
  console.log('========================================\n');
}

createCompleteDecision().catch(console.error);
