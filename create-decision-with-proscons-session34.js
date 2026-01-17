const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'aed0f408-9e46-44a7-954f-cb668279a940';

async function createDecisionWithProsCons() {
  // 1. Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for Pros/Cons Editing - Session 34',
      description: 'This decision is for testing pros/cons editing functionality',
      status: 'draft',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Decision created:', decision.id);

  // 2. Create options
  const { data: options, error: optionsError } = await supabase
    .from('options')
    .insert([
      {
        decision_id: decision.id,
        title: 'Option Alpha - Session 34',
        description: 'First option with pros and cons'
      },
      {
        decision_id: decision.id,
        title: 'Option Beta - Session 34',
        description: 'Second option with pros and cons'
      }
    ])
    .select();

  if (optionsError) {
    console.error('Error creating options:', optionsError);
    return;
  }

  console.log('Options created:', options.length);

  // 3. Create pros and cons for Option Alpha
  const { data: alphaProsCons, error: alphaProsConsError } = await supabase
    .from('pros_cons')
    .insert([
      {
        option_id: options[0].id,
        type: 'pro',
        content: 'Existing Pro 1 - Alpha',
        weight: 5,
        ai_extracted: false,
        display_order: 0
      },
      {
        option_id: options[0].id,
        type: 'pro',
        content: 'Existing Pro 2 - Alpha',
        weight: 5,
        ai_extracted: false,
        display_order: 1
      },
      {
        option_id: options[0].id,
        type: 'con',
        content: 'Existing Con 1 - Alpha',
        weight: 5,
        ai_extracted: false,
        display_order: 0
      }
    ])
    .select();

  if (alphaProsConsError) {
    console.error('Error creating pros/cons for Alpha:', alphaProsConsError);
    return;
  }

  console.log('Pros/cons created for Alpha:', alphaProsCons.length);

  // 4. Create pros and cons for Option Beta
  const { data: betaProsCons, error: betaProsConsError } = await supabase
    .from('pros_cons')
    .insert([
      {
        option_id: options[1].id,
        type: 'pro',
        content: 'Existing Pro 1 - Beta',
        weight: 5,
        ai_extracted: false,
        display_order: 0
      },
      {
        option_id: options[1].id,
        type: 'con',
        content: 'Existing Con 1 - Beta',
        weight: 5,
        ai_extracted: false,
        display_order: 0
      },
      {
        option_id: options[1].id,
        type: 'con',
        content: 'Existing Con 2 - Beta',
        weight: 5,
        ai_extracted: false,
        display_order: 1
      }
    ])
    .select();

  if (betaProsConsError) {
    console.error('Error creating pros/cons for Beta:', betaProsConsError);
    return;
  }

  console.log('Pros/cons created for Beta:', betaProsCons.length);

  console.log('\n=== Test Data Created Successfully ===');
  console.log('Decision ID:', decision.id);
  console.log('Option Alpha ID:', options[0].id);
  console.log('Option Beta ID:', options[1].id);
  console.log('\nOption Alpha:');
  console.log('  - 2 pros, 1 con');
  console.log('Option Beta:');
  console.log('  - 1 pro, 2 cons');
}

createDecisionWithProsCons();
