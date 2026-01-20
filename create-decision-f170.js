const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecisionWithMultipleOptions() {
  const userId = '7b0951b4-9e9e-4284-b50a-3a43dc2ab6a7'; // test_f170 user ID

  try {
    console.log('✅ Using user ID:', userId);

    // Create decision
    const { data: decisionData, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: 'Test Decision for Feature 170 - Cascade Delete Test'
      })
      .select()
      .single();

    if (decisionError) {
      console.log('Error creating decision:', decisionError.message);
      return;
    }

    const decisionId = decisionData.id;
    console.log('✅ Created decision with ID:', decisionId);

    // Create multiple options
    const options = [
      {
        decision_id: decisionId,
        title: 'Option 1 - Stay at current job',
        display_order: 1
      },
      {
        decision_id: decisionId,
        title: 'Option 2 - Join new company',
        display_order: 2
      },
      {
        decision_id: decisionId,
        title: 'Option 3 - Start business',
        display_order: 3
      }
    ];

    const { data: optionsData, error: optionsError } = await supabase
      .from('options')
      .insert(options)
      .select();

    if (optionsError) {
      console.log('Error creating options:', optionsError.message);
      return;
    }

    console.log('✅ Created 3 options:');
    optionsData.forEach(opt => {
      console.log('  - Option ID:', opt.id, '-', opt.title);
    });

    console.log('\n✅ Test data created successfully!');
    console.log('Decision ID:', decisionId);
    console.log('Option IDs:', optionsData.map(o => o.id).join(', '));

  } catch (error) {
    console.log('Error:', error.message);
  }
}

createDecisionWithMultipleOptions();
