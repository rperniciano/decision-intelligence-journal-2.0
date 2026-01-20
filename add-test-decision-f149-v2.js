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
  // Get ANY existing user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.log('No users found. Creating one...');
    // Create a test user with email confirmed
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'testf149@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { name: 'Test User F149' }
    });

    if (createError) {
      console.log('Failed to create user:', createError.message);
      return;
    }
    users = [newUser.user];
    console.log('Created test user:', newUser.user.email);
  }

  const user = users[0];
  const userId = user.id;
  console.log('Using user:', user.email, '(' + userId + ')');

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
    console.log('\nCreated test decision for Feature #149:');
    console.log('  ID:', decisionData.id);
    console.log('  Title:', decisionData.title);
    console.log('  AI Extraction:', JSON.stringify(decisionData.ai_extraction, null, 2));
    console.log('\nReview page URL: http://localhost:5173/decisions/' + decisionData.id + '/review');
    console.log('\nUse credentials:');
    console.log('  Email:', user.email);
    console.log('  Password: password123 (if newly created)');
  }
}

addTestDecision();
