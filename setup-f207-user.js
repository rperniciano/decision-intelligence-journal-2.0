import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createF207User() {
  const email = 'f207-test@example.com';
  const password = 'test123456';

  // Create user
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'F207 Test User'
    }
  });

  if (createError) {
    // User might already exist, try to get them
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      console.log('Using existing user:', user.id);
      await addTestData(user.id);
    } else {
      console.error('Error creating user:', createError);
    }
    return;
  }

  console.log('Created user:', newUser.user.id);
  await addTestData(newUser.user.id);
}

async function addTestData(userId) {
  // Get category IDs
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .in('name', ['Career', 'Finance', 'Health', 'Housing', 'Personal']);

  if (!categories || categories.length === 0) {
    console.log('No categories found');
    return;
  }

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  console.log('Category IDs:', categoryMap);

  const testData = [
    {
      title: 'F207: Switch to new job offer',
      category_id: categoryMap['Career'],
      outcome: 'better',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Buy a new car',
      category_id: categoryMap['Finance'],
      outcome: 'better',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Move to new apartment',
      category_id: categoryMap['Housing'],
      outcome: 'worse',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Take online course',
      category_id: categoryMap['Career'],
      outcome: 'better',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Invest in stocks',
      category_id: categoryMap['Finance'],
      outcome: 'worse',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Start fitness program',
      category_id: categoryMap['Health'],
      outcome: 'better',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Adopt a pet',
      category_id: categoryMap['Personal'],
      outcome: 'better',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Change diet plan',
      category_id: categoryMap['Health'],
      outcome: 'as_expected',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Renovate kitchen',
      category_id: categoryMap['Housing'],
      outcome: 'better',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F207: Launch side project',
      category_id: categoryMap['Career'],
      outcome: 'worse',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  console.log('\n=== Adding F207 Test Decisions ===');

  for (const data of testData) {
    const decisionId = randomUUID();

    const { error } = await supabase
      .from('decisions')
      .insert({
        id: decisionId,
        user_id: userId,
        title: data.title,
        category_id: data.category_id,
        outcome: data.outcome,
        status: 'decided',
        detected_emotional_state: 'neutral',
        created_at: data.created_at,
        updated_at: data.created_at,
      });

    if (error) {
      console.error(`Error inserting "${data.title}":`, error.message);
    } else {
      console.log(`✓ Added: ${data.title}`);
    }
  }

  console.log('\n=== Ready to Test ===');
  console.log('Email: f207-test@example.com');
  console.log('Password: test123456');
  console.log('\nYou can now login and view the Insights page to see category performance!');
}

createF207User().catch(console.error);
