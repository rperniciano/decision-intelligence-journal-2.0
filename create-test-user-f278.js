const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUserAndDecisions() {
  console.log('Creating test user and decisions for Feature #278 testing...');

  // Create test user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'testuser278@example.com',
    password: 'Test123456',
    email_confirm: true
  });

  if (userError) {
    console.log('User already exists, fetching user ID...');
    // User already exists, get their ID from auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === 'testuser278@example.com');

    if (existingUser) {
      console.log('Using existing user:', existingUser.id);
      var userId = existingUser.id;
    } else {
      console.error('Could not find user');
      return;
    }
  } else {
    console.log('Created user:', userData.user.id);
    var userId = userData.user.id;
  }

  // Count existing decisions for this user
  const { count: existingCount } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log(`Existing decisions for user: ${existingCount}`);

  // Create 15 test decisions with varied data
  const decisions = [];

  for (let i = 1; i <= 15; i++) {
    const decision = {
      user_id: userId,
      title: `Test Decision ${i} for CSV Export`,
      description: `This is test decision ${i} created to verify CSV export includes all records.`,
      created_at: new Date(Date.now() - i * 86400000).toISOString() // Staggered by day
    };
    decisions.push(decision);
  }

  // Insert decisions
  const { data: insertedDecisions, error: insertError } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (insertError) {
    console.error('Error inserting decisions:', insertError);
    return;
  }

  console.log(`Inserted ${insertedDecisions.length} decisions`);

  // Add options to some decisions
  for (const decision of insertedDecisions.slice(0, 10)) {
    await supabase.from('options').insert([
      {
        decision_id: decision.id,
        name: `Option A for ${decision.title}`,
        description: 'First option description'
      },
      {
        decision_id: decision.id,
        name: `Option B for ${decision.title}`,
        description: 'Second option description'
      }
    ]);
  }

  // Add outcomes to some decisions
  for (const decision of insertedDecisions.slice(0, 5)) {
    await supabase.from('outcomes').insert({
      decision_id: decision.id,
      outcome_text: `Outcome for ${decision.title}`,
      satisfaction_rating: 4,
      outcome_date: new Date().toISOString()
    });
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log(`\n========================================`);
  console.log(`Test data ready for Feature #278`);
  console.log(`========================================`);
  console.log(`User: testuser278@example.com`);
  console.log(`Password: Test123456`);
  console.log(`Total decisions: ${finalCount}`);
  console.log(`Decisions with options: 10`);
  console.log(`Decisions with outcomes: 5`);
  console.log(`========================================\n`);
}

createTestUserAndDecisions();
