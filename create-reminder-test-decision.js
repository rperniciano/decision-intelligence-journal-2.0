// Create a test decision for reminder feature testing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  const userId = '18aaa6b6-12cd-4658-ab40-a57d19713f5d'; // onboarding user

  // Get a category ID first
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  const categoryId = categories && categories.length > 0 ? categories[0].id : null;

  // Create a decided decision
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'REMINDER_TEST_DECISION_SESSION47',
      raw_transcript: 'This is a test decision for reminder functionality',
      status: 'decided',
      detected_emotional_state: 'confident',
      category_id: categoryId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error);
    return;
  }

  console.log('✅ Decision created:', {
    id: decision.id,
    title: decision.title,
    status: decision.status
  });

  // Create an option and mark it as chosen
  const { data: option, error: optError } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'Option A - The chosen option',
      description: 'This is the option we chose',
      is_chosen: true
    })
    .select()
    .single();

  if (optError) {
    console.error('Error creating option:', optError);
    return;
  }

  console.log('✅ Option created and marked as chosen:', {
    id: option.id,
    title: option.title,
    is_chosen: option.is_chosen
  });

  console.log('\n📋 Decision ready for reminder testing!');
  console.log('Decision ID:', decision.id);
}

createDecision().catch(console.error);
