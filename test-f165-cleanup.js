/**
 * Clean up test decisions for Feature #165
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function cleanupDecisions() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Sign in
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'export103@test.com',
    password: 'test123456'
  });

  const userId = signInData.user.id;

  // Delete test decisions
  const testDecisionIds = [
    '18974a38-b7fe-4e4d-b9ff-c444902cae98', // Atomic Save Test Decision
    'c0594038-d42e-4310-8e52-82c129834b47', // Refresh Test Decision
  ];

  for (const decisionId of testDecisionIds) {
    // First delete pros/cons for this decision's options
    const { data: options } = await supabase
      .from('options')
      .select('id')
      .eq('decision_id', decisionId);

    if (options && options.length > 0) {
      for (const option of options) {
        await supabase
          .from('pros_cons')
          .delete()
          .eq('option_id', option.id);
      }

      // Delete options
      await supabase
        .from('options')
        .delete()
        .eq('decision_id', decisionId);
    }

    // Delete the decision
    await supabase
      .from('decisions')
      .delete()
      .eq('id', decisionId);

    console.log(`✓ Deleted decision: ${decisionId}`);
  }

  console.log('\nCleanup complete!');
}

cleanupDecisions();
