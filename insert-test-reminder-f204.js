// Feature #204: Insert test reminder directly to database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function insertTestReminder() {
  try {
    // Get user ID
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === 'test204@example.com');

    if (!user) {
      console.log('User not found');
      return;
    }

    // First create a decision
    const pastDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago

    const { data: decision } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: 'Test F204 - Decision With Due Reminder',
        status: 'decided',
        decided_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Decision created:', decision.id);

    // Now insert the reminder using raw SQL to bypass schema issues
    const { data: reminder, error } = await supabase.rpc('exec', {
      sql: `INSERT INTO "DecisionsFollowUpReminders" (decision_id, user_id, remind_at, status, created_at)
            VALUES ('${decision.id}', '${user.id}', '${pastDate}', 'pending', NOW())
            RETURNING *`
    });

    if (error) {
      // Try direct insert
      const { data: reminder2, error: err2 } = await supabase
        .from('DecisionsFollowUpReminders')
        .insert({
          decision_id: decision.id,
          user_id: user.id,
          remind_at: pastDate,
          status: 'pending'
        })
        .select();

      if (err2) {
        console.log('Error creating reminder:', err2.message);
        console.log('Trying different column names...');

        // Try without remind_at
        const { data: reminder3, error: err3 } = await supabase
          .from('DecisionsFollowUpReminders')
          .insert({
            decision_id: decision.id,
            user_id: user.id,
            status: 'pending'
          })
          .select();

        if (err3) {
          console.log('Still error:', err3.message);
          console.log('Full error:', err3);
        } else {
          console.log('Reminder created without remind_at:', reminder3);
        }
      } else {
        console.log('Reminder created:', reminder2);
      }
    } else {
      console.log('Reminder created via RPC:', reminder);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

insertTestReminder();
