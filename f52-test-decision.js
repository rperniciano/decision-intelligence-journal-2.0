const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDecision() {
  const timestamp = new Date().toISOString();
  const uniqueTitle = `F52_Regression_Test_${timestamp}`;

  const decision = {
    user_id: '5a7e8f9c-3b1d-4e8f-9a2b-1c3d4e5f6a7b', // feature272.test@example.com user ID
    title: uniqueTitle,
    status: 'deliberating',
    decision_content: 'This is a regression test decision for Feature #52 - data persistence verification through page refresh.',
  };

  const { data, error } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (error) {
    console.error('Error creating test decision:', error);
    process.exit(1);
  }

  console.log('✅ Test decision created successfully!');
  console.log('ID:', data.id);
  console.log('Title:', data.title);
  console.log('Content:', data.decision_content);
  console.log('\nThis decision will be used to verify persistence after page refresh.');
  return data;
}

createTestDecision()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
