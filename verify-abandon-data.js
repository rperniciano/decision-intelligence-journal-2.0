const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAbandonData() {
  const decisionId = '5a1cc8ef-cd9a-47aa-be6b-45d1f8a96050';

  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status, abandon_reason, abandon_note')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Decision Data:');
  console.log('ID:', data.id);
  console.log('Title:', data.title);
  console.log('Status:', data.status);
  console.log('Abandon Reason:', data.abandon_reason);
  console.log('Abandon Note:', data.abandon_note);

  if (data.status === 'abandoned' && data.abandon_reason && data.abandon_note) {
    console.log('\n✅ Abandon data saved correctly!');
  } else if (data.abandon_reason === undefined) {
    console.log('\n⚠️ abandon_reason column does not exist in database');
    console.log('   Run migration-add-abandon-fields.sql in Supabase SQL Editor');
  } else {
    console.log('\n❌ Abandon data not saved correctly');
  }
}

verifyAbandonData();
