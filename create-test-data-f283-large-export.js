// Create test user with 50+ decisions for large export testing (Feature #283)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER = {
  email: 'test_f283_large_export@example.com',
  password: 'Test1234!',
  user_metadata: {
    full_name: 'Test User F283 Large Export'
  }
};

async function createTestUserAndDecisions() {
  console.log('Creating test user for Feature #283...');

  // Check if user exists in auth
  let userId;
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existingAuthUser = users.find(u => u.email === TEST_USER.email);

  if (existingAuthUser) {
    console.log('User exists in auth, updating password...');
    userId = existingAuthUser.id;

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: TEST_USER.password
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
    } else {
      console.log('Password reset successfully');
    }
  } else {
    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: TEST_USER.user_metadata
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    userId = newUser.user.id;
    console.log('User created successfully');
  }

  // Delete existing decisions
  const { error: deleteError } = await supabase
    .from('decisions')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting existing decisions:', deleteError);
  } else {
    console.log('Deleted existing decisions');
  }


  // Create categories
  console.log('Creating categories...');
  const categoryNames = ['Career', 'Finance', 'Personal', 'Health', 'Relationships'];
  const categoryData = [];

  for (const name of categoryNames) {
    const { data: existingCat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (existingCat) {
      categoryData.push({ name, id: existingCat.id });
      console.log(`✓ Using existing category: ${name}`);
    } else {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const colors = {
        'Career': '#3b82f6',
        'Finance': '#22c55e',
        'Personal': '#8b5cf6',
        'Health': '#ef4444',
        'Relationships': '#f59e0b'
      };
      const icons = {
        'Career': '💼',
        'Finance': '💰',
        'Personal': '👤',
        'Health': '❤️',
        'Relationships': '🤝'
      };

      const { data: newCat } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: name,
          slug: slug,
          color: colors[name],
          icon: icons[name],
          is_system: false,
          display_order: categoryNames.indexOf(name)
        })
        .select()
        .single();

      categoryData.push({ name, id: newCat.id });
      console.log(`✓ Created category: ${name}`);
    }
  }

  // Create 55 decisions with variety of statuses and categories
  console.log('Creating 55 decisions...');

  const statuses = ['draft', 'in_progress', 'decided', 'abandoned'];
  const emotionalStates = ['confident', 'uncertain', 'anxious', 'excited', 'calm'];

  const decisions = [];

  for (let i = 1; i <= 55; i++) {
    const status = statuses[i % statuses.length];
    const categoryIdx = i % categoryNames.length;
    const decision = {
      user_id: userId,
      category_id: categoryData[categoryIdx].id,
      title: `F283_TEST: Large Export Decision ${i}`,
      status: status,
      detected_emotional_state: emotionalStates[i % emotionalStates.length],
      description: `Test notes for decision ${i}. This is to test large export functionality with 50+ decisions. `,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      decided_at: status === 'decided' ? new Date(Date.now() - i * 3000000).toISOString() : null
    };
    decisions.push(decision);
  }

  // Batch insert decisions
  const { data: insertedDecisions, error: insertError } = await supabase
    .from('decisions')
    .insert(decisions)
    .select('id');

  if (insertError) {
    console.error('Error inserting decisions:', insertError);
    throw insertError;
  }

  console.log(`Created ${insertedDecisions.length} decisions successfully`);

  // Add options to some decisions
  console.log('Adding options to decisions...');
  const optionPromises = insertedDecisions.map((decision, idx) => {
    const options = [
      {
        decision_id: decision.id,
        text: `Option 1 for decision ${idx + 1}`,
        pros: 'Pro 1, Pro 2, Pro 3',
        cons: 'Con 1, Con 2',
        attributes: '{}'
      },
      {
        decision_id: decision.id,
        text: `Option 2 for decision ${idx + 1}`,
        pros: 'Pro 1, Pro 2',
        cons: 'Con 1, Con 2, Con 3',
        attributes: '{}'
      }
    ];

    return supabase.from('decision_options').insert(options);
  });

  await Promise.all(optionPromises);
  console.log('Added options to all decisions');

  console.log('\n=== TEST DATA CREATED SUCCESSFULLY ===');
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Password: ${TEST_USER.password}`);
  console.log(`Total decisions: 55`);
  console.log(`Categories: ${categoryNames.join(', ')}`);
  console.log(`Statuses: ${statuses.join(', ')}`);
}

createTestUserAndDecisions()
  .then(() => {
    console.log('\nTest data creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
