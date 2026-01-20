const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config({ path: '.env' });

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'test_f275_all_fields@example.com';

async function getUserId() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const user = users.find(u => u.email === TEST_EMAIL);
  if (!user) {
    throw new Error(`Test user ${TEST_EMAIL} not found`);
  }
  return user.id;
}

async function createTestData() {
  const userId = await getUserId();
  console.log('Using user ID:', userId);

  // Create a category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'Career F275',
      slug: 'career-f275',
      icon: '💼',
      color: '#00d4aa'
    })
    .select()
    .single();

  if (categoryError) {
    console.error('Error creating category:', categoryError);
    throw categoryError;
  }
  console.log('✓ Category created:', category.id);

  // Create 3 decisions with different data
  const decisions = [];

  for (let i = 1; i <= 3; i++) {
    const decisionId = generateUUID();

    // Create decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        id: decisionId,
        user_id: userId,
        title: `Test Decision ${i} - F275`,
        description: `Description for decision ${i}`,
        raw_transcript: `Transcript for decision ${i}`,
        status: i === 1 ? 'decided' : i === 2 ? 'in_progress' : 'draft',
        decided_at: i === 1 ? new Date().toISOString() : null,
        chosen_option_id: i === 1 ? null : null, // Will update after creating options
        category_id: category.id,
        detected_emotional_state: i === 1 ? 'confident' : i === 2 ? 'anxious' : 'neutral',
        emotional_confidence: 0.8,
        outcome: i === 1 ? 'better' : null,
        outcome_notes: i === 1 ? 'Great outcome!' : null,
        outcome_recorded_at: i === 1 ? new Date().toISOString() : null,
        follow_up_date: i === 1 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        tags: i === 1 ? ['important', 'work'] : [],
        hour_of_day: 10,
        day_of_week: 1,
      })
      .select()
      .single();

    if (decisionError) {
      console.error('Error creating decision:', decisionError);
      throw decisionError;
    }
    console.log(`✓ Decision ${i} created:`, decision.id);

    // Create 2-3 options for each decision
    const options = [];
    for (let j = 1; j <= (i === 1 ? 3 : 2); j++) {
      const optionId = generateUUID();

      const { data: option, error: optionError } = await supabase
        .from('options')
        .insert({
          id: optionId,
          decision_id: decisionId,
          title: `Option ${j} for Decision ${i}`,
          description: `Description for option ${j}`,
          display_order: j,
          is_chosen: i === 1 && j === 1, // First option chosen for first decision
          ai_extracted: true
        })
        .select()
        .single();

      if (optionError) {
        console.error('Error creating option:', optionError);
        throw optionError;
      }
      options.push(option);
      console.log(`  ✓ Option ${j} created:`, option.id);

      // Create 2-3 pros/cons for each option
      for (let k = 1; k <= 2; k++) {
        const proConId = generateUUID();

        const { error: proConError } = await supabase
          .from('pros_cons')
          .insert({
            id: proConId,
            option_id: optionId,
            type: k % 2 === 0 ? 'con' : 'pro',
            content: `${k % 2 === 0 ? 'Con' : 'Pro'} ${k} for option ${j}`,
            weight: 5,
            display_order: k,
            ai_extracted: true
          });

        if (proConError) {
          console.error('Error creating pro/con:', proConError);
          throw proConError;
        }
        console.log(`    ✓ ${k % 2 === 0 ? 'Con' : 'Pro'} ${k} created`);
      }
    }

    // Update chosen_option_id for decided decision
    if (i === 1) {
      const chosenOption = options.find(o => o.is_chosen);
      if (chosenOption) {
        await supabase
          .from('decisions')
          .update({ chosen_option_id: chosenOption.id })
          .eq('id', decisionId);
        console.log(`  ✓ Updated chosen_option_id:`, chosenOption.id);
      }
    }

    // Reminders not critical for testing JSON export - skipping for now
    // TODO: Add reminder test after schema check

    decisions.push({ ...decision, options });
  }

  console.log('\n✓ Test data created successfully!');
  console.log(`  - 3 decisions`);
  console.log(`  - 8 options`);
  console.log(`  - 16 pros/cons`);
  console.log(`  - 1 category`);
  console.log('\nUser:', TEST_EMAIL);
}

createTestData()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
