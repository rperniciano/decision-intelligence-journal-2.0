import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
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

  // Feature #207: Create test decisions with categories and outcomes
  const testData = [
    {
      title: 'Switch to new job offer',
      category: 'Career',
      outcome: 'better',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
    {
      title: 'Buy a new car',
      category: 'Finance',
      outcome: 'better',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    },
    {
      title: 'Move to new apartment',
      category: 'Housing',
      outcome: 'worse',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    },
    {
      title: 'Take online course',
      category: 'Career',
      outcome: 'better',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    },
    {
      title: 'Invest in stocks',
      category: 'Finance',
      outcome: 'worse',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    },
    {
      title: 'Start fitness program',
      category: 'Health',
      outcome: 'better',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    },
    {
      title: 'Adopt a pet',
      category: 'Personal',
      outcome: 'better',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    {
      title: 'Change diet plan',
      category: 'Health',
      outcome: 'as_expected',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
    {
      title: 'Renovate kitchen',
      category: 'Housing',
      outcome: 'better',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      title: 'Launch side project',
      category: 'Career',
      outcome: 'worse',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
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
        category: data.category,
        outcome: data.outcome,
        status: 'reviewed',
        emotional_state: 'neutral',
        created_at: data.created_at,
        updated_at: data.created_at,
      });

    if (error) {
      console.error(`Error inserting "${data.title}":`, error.message);
    } else {
      console.log(`✓ Added: ${data.title} (${data.category}, ${data.outcome})`);
    }
  }

  console.log('\n=== Verifying Data ===');

  const { data: decisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  console.log(`Total decisions: ${decisions.length}`);

  // Group by category
  const categoryGroups = {};
  decisions.forEach(d => {
    const cat = d.category || 'Uncategorized';
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
