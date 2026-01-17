import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  try {
    // Get session22test user
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'session22test@example.com');

    if (!user) {
      console.error('User not found');
      return;
    }

    const userId = user.id;
    console.log('Creating test decision for user:', userId);

    // Get first available category
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    const categoryId = categories?.[0]?.id;

    // Create a decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: 'CASCADE_TEST_DECISION',
        description: 'This decision is for testing cascade delete',
        status: 'decided',
        category_id: categoryId
      })
      .select()
      .single();

    if (decisionError) {
      console.error('Error creating decision:', decisionError);
      return;
    }

    console.log('Decision created:', decision.id);

    // Create options
    const options = [
      {
        decision_id: decision.id,
        title: 'Option A - CASCADE TEST',
        description: 'First option for cascade test',
        is_chosen: true,
        display_order: 0
      },
      {
        decision_id: decision.id,
        title: 'Option B - CASCADE TEST',
        description: 'Second option for cascade test',
        is_chosen: false,
        display_order: 1
      }
    ];

    const { data: createdOptions, error: optionsError } = await supabase
      .from('options')
      .insert(options)
      .select();

    if (optionsError) {
      console.error('Error creating options:', optionsError);
      return;
    }

    console.log(`Created ${createdOptions.length} options`);

    // Create pros and cons for each option
    const prosAndCons = [
      // Option A pros/cons
      {
        option_id: createdOptions[0].id,
        type: 'pro',
        content: 'Pro 1 for Option A - CASCADE TEST',
        weight: 1,
        display_order: 0
      },
      {
        option_id: createdOptions[0].id,
        type: 'con',
        content: 'Con 1 for Option A - CASCADE TEST',
        weight: 1,
        display_order: 0
      },
      // Option B pros/cons
      {
        option_id: createdOptions[1].id,
        type: 'pro',
        content: 'Pro 1 for Option B - CASCADE TEST',
        weight: 1,
        display_order: 0
      },
      {
        option_id: createdOptions[1].id,
        type: 'con',
        content: 'Con 1 for Option B - CASCADE TEST',
        weight: 1,
        display_order: 0
      }
    ];

    const { data: createdProsCons, error: proConsError } = await supabase
      .from('pros_cons')
      .insert(prosAndCons)
      .select();

    if (proConsError) {
      console.error('Error creating pros/cons:', proConsError);
      return;
    }

    console.log(`Created ${createdProsCons.length} pros/cons`);

    // Print summary
    console.log('\n=== Test Decision Created ===');
    console.log('Decision ID:', decision.id);
    console.log('Title:', decision.title);
    console.log('Options:', createdOptions.length);
    console.log('Pros/Cons:', createdProsCons.length);
    console.log('\nOption IDs:', createdOptions.map(o => o.id).join(', '));
    console.log('Pros/Cons IDs:', createdProsCons.map(pc => pc.id).join(', '));

    return {
      decisionId: decision.id,
      optionIds: createdOptions.map(o => o.id),
      prosConsIds: createdProsCons.map(pc => pc.id)
    };
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestDecision();
