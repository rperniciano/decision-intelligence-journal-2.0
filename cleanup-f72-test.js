const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  try {
    const decisionId = 'd193bbaa-bced-4d86-9a7c-5885bc4e13d7';

    // Permanently delete the test decision
    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('id', decisionId);

    if (error) {
      console.log('Error cleaning up:', error.message);
    } else {
      console.log('Test decision permanently deleted');
    }

  } catch (err) {
    console.log('Error:', err.message);
  }
}

cleanup();
