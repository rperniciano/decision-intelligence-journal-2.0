const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecisionsWithPositionBias() {
  // Get the first available user
  const { data: { users } } = await supabase.auth.admin.listUsers();

  if (!users || users.length === 0) {
    console.error('No users found');
    return;
  }

  const testUser = users[0];
  console.log(`Using test user: ${testUser.email} (ID: ${testUser.id})`);

  // Create 5 decisions where position 1 is chosen (primacy bias)
  for (let i = 1; i <= 5; i++) {
    // Create decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: `POS_BIAS_TEST_${i}_${Date.now()}`,
        status: 'decided',
        description: 'Test decision for position bias feature',
        outcome: 'better',
      })
      .select()
      .single();

    if (decisionError) {
      console.error('Error creating decision:', decisionError);
      continue;
    }

    console.log(`Created decision ${i}: ${decision.id}`);

    // Create options (position 1, 2, 3)
    const options = [];
    for (let pos = 1; pos <= 3; pos++) {
      const { data: option, error: optionError } = await supabase
        .from('options')
        .insert({
          decision_id: decision.id,
          title: `Option ${pos}`,
          display_order: pos,
        })
        .select()
        .single();

      if (optionError) {
        console.error('Error creating option:', optionError);
        continue;
      }

      options.push(option);
      console.log(`  Created option ${pos}: ${option.id}`);
    }

    // Choose the first option (position 1) to create primacy bias
    if (options.length > 0) {
      const { error: updateError } = await supabase
        .from('decisions')
        .update({
          chosen_option_id: options[0].id, // Always choose position 1
          decided_at: new Date().toISOString(),
        })
        .eq('id', decision.id);

      if (updateError) {
        console.error('Error updating chosen option:', updateError);
      } else {
        console.log(`  Chose option 1 (position 1) as selected`);
      }
    }
  }

  // Create 1 decision where position 2 is chosen (for variety)
  const { data: decision2 } = await supabase
    .from('decisions')
    .insert({
      user_id: testUser.id,
      title: `POS_BIAS_VARIETY_${Date.now()}`,
      status: 'decided',
      description: 'Test decision for position bias feature - variety',
      outcome: 'better',
    })
    .select()
    .single();

  if (decision2) {
    console.log(`Created variety decision: ${decision2.id}`);

    const options2 = [];
    for (let pos = 1; pos <= 3; pos++) {
      const { data: option } = await supabase
        .from('options')
        .insert({
          decision_id: decision2.id,
          title: `Option ${pos}`,
          display_order: pos,
        })
        .select()
        .single();

      if (option) options2.push(option);
    }

    // Choose position 2
    if (options2.length >= 2) {
      await supabase
        .from('decisions')
        .update({
          chosen_option_id: options2[1].id, // Choose position 2
          decided_at: new Date().toISOString(),
        })
        .eq('id', decision2.id);
      console.log(`  Chose option 2 (position 2) as selected`);
    }
  }

  console.log('\n✅ Created 6 test decisions for position bias detection');
  console.log('Expected result: Position #1 should show 83% (5/6) - indicating primacy bias');
}

createTestDecisionsWithPositionBias().catch(console.error);
