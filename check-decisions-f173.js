// Check for decisions with reminders for feature #173 testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function checkData() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get test user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'testf173@example.com');

  if (!testUser) {
    console.log('❌ Test user not found');
    return;
  }

  // Get decisions
  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('user_id', testUser.id)
    .limit(5);

  console.log('\n=== Decisions ===');
  console.log(`Found: ${decisions?.length || 0}`);

  if (decisions && decisions.length > 0) {
    decisions.forEach(d => console.log(`- ${d.title} (${d.id})`));
  }

  // Get reminders
  const { data: reminders } = await supabase
    .from('outcome_reminders')
    .select('*')
    .eq('user_id', testUser.id);

  console.log('\n=== Reminders ===');
  console.log(`Found: ${reminders?.length || 0}`);

  if (reminders && reminders.length > 0) {
    reminders.forEach(r => console.log(`- Decision: ${r.decision_id}, Status: ${r.status}`));
  }
}

checkData().catch(console.error);
