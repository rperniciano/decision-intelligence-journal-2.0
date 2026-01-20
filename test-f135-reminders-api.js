// Test Feature #135: Reminder API Integration
// This script tests if the reminders API is working

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testRemindersAPI() {
  console.log('Testing Feature #135: Reminder API Integration\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Sign in as test user
    console.log('\n1. Signing in as test user...');
    const testEmail = `f135-test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.log('❌ Sign up failed:', signUpError.message);
      return;
    }

    console.log('✅ User created/signed in successfully');

    // Step 2: Get a test decision
    console.log('\n2. Fetching test decisions...');
    const { data: { session } } = await supabase.auth.getSession();

    const decisionsResponse = await fetch('http://localhost:4001/api/v1/decisions', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!decisionsResponse.ok) {
      console.log('❌ Failed to fetch decisions:', decisionsResponse.status);
      return;
    }

    const decisionsData = await decisionsResponse.json();
    const decisions = decisionsData.decisions || [];

    if (decisions.length === 0) {
      console.log('❌ No decisions found. Creating test decision...');

      const createResponse = await fetch('http://localhost:4001/api/v1/decisions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'F135 Test Decision - Reminders API',
          status: 'deliberating',
          emotional_state: 'curious',
          category: 'testing',
          options: [
            { name: 'Option A', position: 0 },
            { name: 'Option B', position: 1 }
          ]
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.log('❌ Failed to create test decision');
        console.log('   Status:', createResponse.status);
        console.log('   Error:', errorText);
        return;
      }

      const createData = await createResponse.json();
      var testDecisionId = createData.decision.id;
      console.log('✅ Test decision created:', testDecisionId);
    } else {
      console.log(`✅ Found ${decisions.length} existing decisions`);
      var testDecisionId = decisions[0].id;
    }

    // Step 3: Try to create a reminder
    console.log('\n3. Testing POST /decisions/:id/reminders...');
    console.log('   Decision ID:', testDecisionId);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const createReminderResponse = await fetch(
      `http://localhost:4001/api/v1/decisions/${testDecisionId}/reminders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          remind_at: tomorrow.toISOString(),
          scheduled_for: tomorrow.toISOString().split('T')[0]
        })
      }
    );

    if (!createReminderResponse.ok) {
      const errorText = await createReminderResponse.text();
      console.log('❌ Failed to create reminder');
      console.log('   Status:', createReminderResponse.status);
      console.log('   Response:', errorText);

      if (errorText.includes('column') || errorText.includes('remind_at')) {
        console.log('\n⚠️  DATABASE SCHEMA ISSUE DETECTED');
        console.log('   The migration fix-reminders-table-f101.sql needs to be executed.');
        console.log('   Missing columns: remind_at, user_id');
      }
      return;
    }

    const reminderData = await createReminderResponse.json();
    console.log('✅ Reminder created successfully!');
    console.log('   Reminder ID:', reminderData.reminder.id);
    console.log('   Remind at:', reminderData.reminder.remind_at);

    // Step 4: Fetch reminders for the decision
    console.log('\n4. Testing GET /decisions/:id/reminders...');

    const getRemindersResponse = await fetch(
      `http://localhost:4001/api/v1/decisions/${testDecisionId}/reminders`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!getRemindersResponse.ok) {
      console.log('❌ Failed to fetch reminders:', getRemindersResponse.status);
      return;
    }

    const remindersData = await getRemindersResponse.json();
    console.log('✅ Reminders fetched successfully!');
    console.log('   Count:', remindersData.reminders.length);

    // Step 5: Update the reminder
    console.log('\n5. Testing PATCH /decisions/:id/reminders/:reminderId...');

    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const updateReminderResponse = await fetch(
      `http://localhost:4001/api/v1/decisions/${testDecisionId}/reminders/${reminderData.reminder.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          remind_at: nextWeek.toISOString()
        })
      }
    );

    if (!updateReminderResponse.ok) {
      console.log('❌ Failed to update reminder:', updateReminderResponse.status);
      return;
    }

    const updatedReminderData = await updateReminderResponse.json();
    console.log('✅ Reminder updated successfully!');
    console.log('   New remind_at:', updatedReminderData.reminder.remind_at);

    // Step 6: Delete the reminder
    console.log('\n6. Testing DELETE /decisions/:id/reminders/:reminderId...');

    const deleteReminderResponse = await fetch(
      `http://localhost:4001/api/v1/decisions/${testDecisionId}/reminders/${reminderData.reminder.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!deleteReminderResponse.ok) {
      console.log('❌ Failed to delete reminder:', deleteReminderResponse.status);
      return;
    }

    console.log('✅ Reminder deleted successfully!');

    console.log('\n' + '='.repeat(60));
    console.log('Feature #135: REMINDER API INTEGRATION - ALL TESTS PASSED ✅\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

testRemindersAPI();
