import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addTestData() {
  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const user = users[0];
  const userId = user.id;
  console.log('Using user:', user.email, '(' + userId + ')');

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

  // Feature #207: Create test decisions with categories and outcomes
  const testData = [
    {
      title: 'Switch to new job offer',
      category_id: categoryMap['Career'],
      outcome: 'better',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Buy a new car',
      category_id: categoryMap['Finance'],
      outcome: 'better',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Move to new apartment',
      category_id: categoryMap['Housing'],
      outcome: 'worse',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Take online course',
      category_id: categoryMap['Career'],
      outcome: 'better',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Invest in stocks',
      category_id: categoryMap['Finance'],
      outcome: 'worse',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Start fitness program',
      category_id: categoryMap['Health'],
      outcome: 'better',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Adopt a pet',
      category_id: categoryMap['Personal'],
      outcome: 'better',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Change diet plan',
      category_id: categoryMap['Health'],
      outcome: 'as_expected',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Renovate kitchen',
      category_id: categoryMap['Housing'],
      outcome: 'better',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Launch side project',
      category_id: categoryMap['Career'],
      outcome: 'worse',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  console.log('\n=== Adding Test Decisions ===');

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

  console.log('\n=== Verifying Data ===');

  const { data: decisions } = await supabase
    .from('decisions')
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  console.log(`Total decisions: ${decisions.length}`);

  // Group by category
  const categoryGroups = {};
  decisions.forEach(d => {
    const cat = d.category?.name || 'Uncategorized';
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = { total: 0, withOutcome: 0, positive: 0 };
    }
    categoryGroups[cat].total++;
    if (d.outcome) {
      categoryGroups[cat].withOutcome++;
      if (d.outcome === 'better') {
        categoryGroups[cat].positive++;
      }
    }
  });

  console.log('\nCategory Performance:');
  Object.entries(categoryGroups).forEach(([cat, stats]) => {
    const successRate = stats.withOutcome > 0 ? (stats.positive / stats.withOutcome) : 0;
    console.log(`  ${cat}: ${stats.total} decisions, ${stats.withOutcome} with outcomes, ${Math.round(successRate * 100)}% success rate`);
  });
}

addTestData().catch(console.error);
