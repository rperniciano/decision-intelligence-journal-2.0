import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '0c1f8cc8-ef76-4cb7-8684-c2911b1df590';

console.log('Creating test decision for user:', userId);

// Create a decision
const { data: decision, error: decisionError } = await supabase
  .from('decisions')
  .insert({
    user_id: userId,
    title: 'TEST_F184_Auto Reminder Decision',
    status: 'deliberating',
    category: 'Testing',
    emotional_state: 'curious'
  })
  .select()
  .single();

if (decisionError) {
  console.error('Error creating decision:', decisionError);
  process.exit(1);
}

console.log('Decision created:', decision.id);

// Create options
const { data: option1, error: opt1Error } = await supabase
  .from('options')
  .insert({
    decision_id: decision.id,
    title: 'Option A',
    is_chosen: false
  })
  .select()
  .single();

const { data: option2, error: opt2Error } = await supabase
  .from('options')
  .insert({
    decision_id: decision.id,
    title: 'Option B',
    is_chosen: false
  })
  .select()
  .single();

console.log('Options created:', option1.id, option2.id);
console.log('Decision ID:', decision.id);
console.log('Option 1 ID:', option1.id);
console.log('Option 2 ID:', option2.id);
