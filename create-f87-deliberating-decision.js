const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createDeliberatingDecision() {
  const userId = 'e5752662-e12f-40c2-b834-a89b2d1f4c4a'; // f87-test@example.com

  // Get Career category
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('name', 'Career')
    .limit(1);

  if (!categories || categories.length === 0) {
    console.error('Career category not found');
    process.exit(1);
  }

  const categoryId = categories[0].id;
  console.log('Using category ID:', categoryId);

  const decisionId = randomUUID();

  // Create the decision with deliberating status
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      id: decisionId,
      user_id: userId,
      title: 'F87 Test Decision - Job Offer',
      category_id: categoryId,
      status: 'draft',
      detected_emotional_state: 'neutral',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    process.exit(1);
  }

  console.log('\n✅ Deliberating decision created!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);

  // Create options
  const option1Id = randomUUID();
  const { data: option1 } = await supabase
    .from('decision_options')
    .insert({
      id: option1Id,
      decision_id: decision.id,
      name: 'Option 1: Stay at current job',
      description: 'Keep current position with stable income and benefits',
      pros: JSON.stringify(['Stable income', 'Good benefits', 'Familiar team']),
      cons: JSON.stringify(['Limited growth', 'Lower salary']),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  const option2Id = randomUUID();
  const { data: option2 } = await supabase
    .from('decision_options')
    .insert({
      id: option2Id,
      decision_id: decision.id,
      name: 'Option 2: Join the startup',
      description: 'Accept offer at the startup with high growth potential',
      pros: JSON.stringify(['Higher salary', 'Growth potential', 'Equity']),
      cons: JSON.stringify(['Less stable', 'Longer hours', 'Risk of failure']),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  console.log('\n✅ Created 2 options:');
  console.log('  -', option1.name);
  console.log('  -', option2.name);
  console.log('\n📝 Ready for testing Feature #87: Transition to Decided status');
  console.log('Navigate to: http://localhost:5173/decisions/' + decision.id);
  console.log('\nVerification Steps:');
  console.log('  1. Navigate to the decision (shown above)');
  console.log('  2. Click "Make Decision" or Edit button');
  console.log('  3. Select which option was chosen');
  console.log('  4. Set confidence level');
  console.log('  5. Save');
  console.log('  6. Verify status is "Decided"');
  console.log('  7. Verify chosen option is marked');
}

createDeliberatingDecision().catch(console.error);
