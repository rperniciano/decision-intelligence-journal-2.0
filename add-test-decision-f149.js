import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addTestDecision() {
  // Use existing test user
  const email = 'f10-logout-test-1768886783687@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  // Create a test decision with AI extraction for Feature #149
  const aiExtraction = {
    title: 'Should I switch to a new job offer?',
    options: [
      {
        name: 'Stay at current job',
        pros: ['Familiar team and processes', 'Good work-life balance', 'Close to home'],
        cons: ['Lower salary', 'Limited growth opportunities', 'Boring projects']
      },
      {
        name: 'Take the new job offer',
        pros: ['30% salary increase', 'Exciting new technologies', 'Better career growth'],
        cons: ['Unknown team culture', 'Longer commute', 'Risk of new environment']
      }
    ],
    emotionalState: 'uncertain',
    suggestedCategory: 'Career',
    confidence: 0.85
  };

  const decision = {
    user_id: userId,
    title: aiExtraction.title,
    status: 'draft',
    detected_emotional_state: aiExtraction.emotionalState,
    ai_extraction: aiExtraction,
    ai_confidence: aiExtraction.confidence,
    transcript: 'I\'m trying to decide between staying at my current job or taking a new offer. The new job pays 30% more and has better growth opportunities, but I\'m worried about the team culture and the longer commute. My current job is stable and close to home, but the salary is lower and projects are boring.',
    created_at: new Date().toISOString()
  };

  const { data: decisionData, error: decisionError } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (decisionError) {
    console.log('Decision error:', decisionError.message);
  } else {
    console.log('Created test decision for Feature #149:');
    console.log('  ID:', decisionData.id);
    console.log('  Title:', decisionData.title);
    console.log('  AI Extraction:', JSON.stringify(decisionData.ai_extraction, null, 2));
    console.log('\nReview page URL: http://localhost:5173/decisions/' + decisionData.id + '/review');
  }
}

addTestDecision();
