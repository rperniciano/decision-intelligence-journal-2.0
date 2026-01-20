const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('Testing reminder insert to verify schema...\n');

  const testReminder = {
    decision_id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    remind_at: new Date().toISOString(),
    status: 'pending'
  };

  console.log('Inserting test reminder with columns:');
  Object.keys(testReminder).forEach(key => {
    console.log(`  - ${key}`);
  });
  console.log('');

  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert(testReminder)
    .select();

  if (error) {
    console.log('❌ Insert failed');
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code}`);

    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n⚠️  SCHEMA ISSUE DETECTED');
      console.log('Missing columns detected. Migration not executed.');
    }

    // Clean up attempt
    await supabase
      .from('DecisionsFollowUpReminders')
      .delete()
      .eq('decision_id', testReminder.decision_id);

    process.exit(1);
  } else {
    console.log('✅ Insert successful');
    console.log('Columns returned:', Object.keys(data[0]));

    const hasRemindAt = 'remind_at' in data[0];
    const hasUserId = 'user_id' in data[0];

    console.log('\nSchema verification:');
    console.log(`  remind_at: ${hasRemindAt ? '✅' : '❌'}`);
    console.log(`  user_id: ${hasUserId ? '✅' : '❌'}`);

    // Clean up
    await supabase
      .from('DecisionsFollowUpReminders')
      .delete()
      .eq('decision_id', testReminder.decision_id);

    console.log('\n✅ Test data cleaned up');

    if (hasRemindAt && hasUserId) {
      console.log('\n✅ SCHEMA READY - Feature #135 can proceed');
      process.exit(0);
    } else {
      console.log('\n❌ SCHEMA NOT READY - Migration required');
      process.exit(1);
    }
  }
}

testInsert();
