const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addOptions() {
  const decisionId = 'e6c199c3-4abb-4569-8042-858dbf9c8c4d';

  const options = [
    {
      decision_id: decisionId,
      title: 'Option A - Continue with current approach',
      description: 'Keep things as they are',
      display_order: 0,
      is_chosen: false,
      ai_extracted: false
    },
    {
      decision_id: decisionId,
      title: 'Option B - Try a new strategy',
      description: 'Experiment with different methods',
      display_order: 1,
      is_chosen: false,
      ai_extracted: false
    },
    {
      decision_id: decisionId,
      title: 'Option C - Hybrid approach',
      description: 'Combine elements from both',
      display_order: 2,
      is_chosen: false,
      ai_extracted: false
    }
  ];

  const { data, error } = await supabase
    .from('options')
    .insert(options)
    .select();

  if (error) {
    console.error('Error adding options:', error);
  } else {
    console.log('Successfully added options:', JSON.stringify(data, null, 2));
  }
}

addOptions();
