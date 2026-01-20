const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createF258TestData() {
  try {
    // Create user
    const timestamp = Date.now();
    const email = `f258-overdue-test-${timestamp}@example.com`;
    const password = 'test123456';

    console.log('Creating test user for Feature #258...');
    console.log('Email:', email);
    console.log('Password:', password);

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'F258 Overdue Test User' }
    });

    if (userError) {
      if (userError.message.includes('already been registered')) {
        console.log('User already exists, getting existing user...');
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === email);
        if (user) {
          await createDecisions(user.id);
        }
        return;
      }
      throw userError;
    }

    console.log('✓ User created:', userData.user.id);
    await createDecisions(userData.user.id);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function createDecisions(userId) {
  // Create a decision with a past follow-up date (should be marked as overdue)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format

  const overdueDecision = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'OVERDUE_DECISION_F258',
      status: 'in_progress', // Not decided yet, so should show as overdue
      follow_up_date: yesterdayStr
    })
    .select()
    .single();

  if (overdueDecision.error) {
    console.error('Error creating overdue decision:', overdueDecision.error);
  } else {
    console.log('✓ Created OVERDUE decision with follow_up_date:', yesterdayStr);
    console.log('  Decision ID:', overdueDecision.data.id);
  }

  // Create a decision with a future follow-up date (should NOT be marked as overdue)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const futureDecision = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'FUTURE_DECISION_F258',
      status: 'in_progress',
      follow_up_date: tomorrowStr
    })
    .select()
    .single();

  if (futureDecision.error) {
    console.error('Error creating future decision:', futureDecision.error);
  } else {
    console.log('✓ Created FUTURE decision with follow_up_date:', tomorrowStr);
    console.log('  Decision ID:', futureDecision.data.id);
  }

  // Create a decided decision with a past follow-up date (should NOT be overdue because it's decided)
  const decidedDecision = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DECIDED_DECISION_F258',
      status: 'decided', // Already decided, so should NOT show as overdue
      follow_up_date: yesterdayStr
    })
    .select()
    .single();

  if (decidedDecision.error) {
    console.error('Error creating decided decision:', decidedDecision.error);
  } else {
    console.log('✓ Created DECIDED decision with past follow_up_date:', yesterdayStr);
    console.log('  Decision ID:', decidedDecision.data.id);
  }

  console.log('\n✓ Test data ready for Feature #258 verification');
  console.log('\nTest Cases:');
  console.log('1. OVERDUE_DECISION_F258 - Should show overdue badge (deliberating + past follow_up_date)');
  console.log('2. FUTURE_DECISION_F258 - Should NOT show overdue badge (future follow_up_date)');
  console.log('3. DECIDED_DECISION_F258 - Should NOT show overdue badge (already decided)');
}

createF258TestData();
