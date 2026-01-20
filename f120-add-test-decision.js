const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function addTestDecision() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // First, get the auth token for our test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'f120-regression-1768911801310@example.com',
    password: 'Test123456'
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  console.log('Authenticated successfully');

  // Create a test decision
  const decision = {
    title: 'Feature 120 Regression Test Decision',
    category: 'Technology',
    status: 'in_progress',
    options: [
      {
        id: '1',
        text: 'Option A - Keep current system',
        pros: ['Familiar', 'Stable'],
        cons: ['Outdated', 'Limited features']
      },
      {
        id: '2',
        text: 'Option B - Upgrade to new platform',
        pros: ['Modern', 'More features'],
        cons: ['Learning curve', 'Migration effort']
      }
    ],
    emotional_context: {
      primary: 'cautious',
      intensity: 3
    },
    transcript: 'This is a test decision for Feature 120 regression testing.',
    audio_url: null
  };

  const { data: decisionData, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: authData.user.id,
      title: decision.title,
      category: decision.category,
      status: decision.status,
      options: decision.options,
      emotional_context: decision.emotional_context,
      transcript: decision.transcript,
      audio_url: decision.audio_url
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError.message);
    process.exit(1);
  }

  console.log('Test decision created successfully');
  console.log('Decision ID:', decisionData.id);
  console.log('Title:', decisionData.title);
  console.log('Category:', decisionData.category);
}

addTestDecision().catch(console.error);
