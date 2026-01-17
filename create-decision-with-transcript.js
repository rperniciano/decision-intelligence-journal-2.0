import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecisionWithTranscript() {
  console.log('Creating decision with real transcript...\n');

  // Get session18test user
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error getting users:', userError);
    return;
  }

  const user = userData.users.find(u => u.email === 'session18test@example.com');
  if (!user) {
    console.error('User session18test@example.com not found');
    return;
  }

  console.log('User ID:', user.id);

  // Get a category
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .limit(1)
    .single();

  if (catError) {
    console.error('Error getting category:', catError);
    return;
  }

  const uniqueId = Date.now();
  const transcript = `I'm trying to decide whether to accept a new job offer at TechCorp. I'm currently working at StartupX and have been there for two years. The new offer is paying fifty thousand more per year, which is significant. However, I'm really anxious about this decision because I love my current team and the culture at StartupX. The pros of accepting the TechCorp offer are: better salary, more career growth opportunities, and better benefits. The cons are: I'll miss my current team, it's a longer commute, and I'm uncertain about the company culture. I really need to think this through carefully.`;

  // Create decision with transcript
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: `TRANSCRIPT_TEST_${uniqueId} - Should I accept the TechCorp job offer?`,
      status: 'decided',
      category_id: categories.id,
      detected_emotional_state: 'anxious',
      raw_transcript: transcript,
      description: 'Deciding between staying at current startup or accepting higher-paying corporate job',
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Created decision with ID:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   Transcript length:', transcript.length, 'characters');
  console.log('   Transcript preview:', transcript.substring(0, 100) + '...');
  console.log('\nDecision created successfully!');
  console.log('Navigate to: http://localhost:5177/decisions/' + decision.id);
}

createDecisionWithTranscript().catch(console.error);
