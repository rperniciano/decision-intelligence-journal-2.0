const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const userId = '90f2e690-b1fb-414f-a259-0194f4b0b3d0'; // session27test user

  // Get Technology category ID
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Technology')
    .single();

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'TEST_SESSION27_FIRST_DECISION',
      category_id: category?.id || null,
      status: 'decided',
      detected_emotional_state: 'confident',
      description: 'This is a test decision for session 27'
    })
    .select()
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Decision created!');
    console.log('ID:', decision.id);
    console.log('Title:', decision.title);
  }
})();
