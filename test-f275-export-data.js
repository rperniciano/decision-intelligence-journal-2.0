const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

async function createTestDataForF275() {
  console.log('Creating test data for Feature #275 (JSON Export)...');

  // Get the test user (f61test@example.com)
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('No users found');
    return;
  }

  const user = users.find(u => u.email === 'f61test@example.com');
  if (!user) {
    console.error('Test user f61test@example.com not found');
    return;
  }

  const userId = user.id;
  console.log('✅ Using user:', user.email, '(' + userId + ')');

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  if (!categories || categories.length === 0) {
    console.error('No categories found');
    return;
  }

  console.log('✅ Found', categories.length, 'categories');

  // Create multiple decisions with different data types
  const testDecisions = [
    {
      title: 'Career Change Decision',
      notes: 'Should I accept the new job offer at TechCorp?',
      status: 'decided',
      category: 'Career',
      emotional_state: 'anxious',
      options: [
        { option_text: 'Accept the offer', pros: ['Higher salary', 'Better benefits'], cons: ['Longer commute', 'Less flexibility'] },
        { option_text: 'Negotiate terms', pros: ['Maybe get better offer'], cons: ['Risk of losing offer'] },
        { option_text: 'Decline and stay', pros: ['Familiar environment'], cons: ['Missed opportunity'] }
      ]
    },
    {
      title: 'Home Purchase',
      notes: 'Buying a house in the suburbs vs staying in apartment',
      status: 'deliberating',
      category: 'Finance',
      emotional_state: 'uncertain',
      options: [
        { option_text: 'Buy house', pros: ['Build equity', 'More space'], cons: ['Higher costs', 'Maintenance'] },
        { option_text: 'Rent apartment', pros: ['Flexibility', 'No maintenance'], cons: ['No equity', 'Rent increases'] }
      ]
    },
    {
      title: 'Learning New Skill',
      notes: 'Should I dedicate time to learn machine learning?',
      status: 'draft',
      category: 'Education',
      emotional_state: 'excited',
      options: [
        { option_text: 'Learn ML', pros: ['Career growth', 'Future-proof'], cons: ['Time intensive', 'Steep learning curve'] },
        { option_text: 'Focus on other skills', pros: ['Faster results'], cons: ['May become obsolete'] }
      ]
    },
    {
      title: 'Health Decision',
      notes: 'Starting a new fitness routine',
      status: 'decided',
      category: 'Health',
      emotional_state: 'motivated',
      options: [
        { option_text: 'Join gym', pros: ['Professional equipment', 'Classes'], cons: ['Cost', 'Travel time'] },
        { option_text: 'Home workouts', pros: ['Free', 'Convenient'], cons: ['Limited equipment', 'Distractions'] }
      ]
    },
    {
      title: 'Relationship Choice',
      notes: 'Moving to a new city for relationship',
      status: 'deliberating',
      category: 'Personal',
      emotional_state: 'conflicted',
      options: [
        { option_text: 'Move to new city', pros: ['Be with partner', 'New experiences'], cons: ['Leave comfort zone', 'Job uncertainty'] },
        { option_text: 'Stay and maintain long-distance', pros: ['Keep current job'], cons: ['Relationship strain'] }
      ]
    }
  ];

  console.log('\nCreating', testDecisions.length, 'test decisions...');

  const createdDecisions = [];
  for (const decisionData of testDecisions) {
    // Extract options from decision data to store as JSONB
    const { options, ...decisionFields } = decisionData;

    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        options: options, // Store as JSONB
        ...decisionFields,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (decisionError) {
      console.error('Error creating decision:', decisionError);
      continue;
    }

    createdDecisions.push(decision);
    console.log('✅ Created:', decision.title, '(ID:', decision.id + ')');
    console.log('   Status:', decision.status, '| Category:', decision.category);
    console.log('   Options:', decision.options.length, 'options included');
  }

  console.log('\n✅ Test data creation complete!');
  console.log('Created', createdDecisions.length, 'decisions with various data types:');
  console.log('  - Different statuses (draft, deliberating, decided)');
  console.log('  - Different categories (Career, Finance, Education, Health, Personal)');
  console.log('  - Various emotional states (anxious, uncertain, excited, motivated, conflicted)');
  console.log('  - Multiple options with pros/cons stored as JSONB');
  console.log('  - Notes and descriptions');
  console.log('\n📋 Next steps:');
  console.log('1. Test JSON export via UI');
  console.log('2. Verify all decisions are included in export');
  console.log('3. Verify all fields (status, category, emotional_state, options, notes) are present');
}

createTestDataForF275().catch(console.error);
