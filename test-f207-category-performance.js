import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCategoryPerformance() {
  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const user = users[0];
  const userId = user.id;
  console.log('Using user:', user.email, '(' + userId + ')');

  // Check for existing decisions with categories and outcomes
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching decisions:', error);
    return;
  }

  console.log('\n=== Existing Decisions ===');
  console.log('Total decisions:', decisions.length);

  const withOutcomes = decisions.filter(d => d.outcome);
  console.log('Decisions with outcomes:', withOutcomes.length);

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

  console.log('\n=== Category Performance ===');
  Object.entries(categoryGroups).forEach(([cat, stats]) => {
    const successRate = stats.withOutcome > 0 ? (stats.positive / stats.withOutcome) : 0;
    console.log(`${cat}: ${stats.total} decisions, ${stats.withOutcome} with outcomes, ${Math.round(successRate * 100)}% success rate`);
  });

  // Test the insights API
  console.log('\n=== Testing API ===');
  const { data: session } = await supabase.auth.admin.generateUserId({
    userId: userId
  });

  // Create a session for the user
  const { data: { session: userSession } } = await supabase.auth.admin.createSession({
    userId: userId
  });

  if (!userSession) {
    console.log('Failed to create session');
    return;
  }

  const token = userSession.access_token;

  // Fetch insights
  const response = await fetch('http://localhost:4001/insights', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error('API Error:', response.status);
    const text = await response.text();
    console.error('Response:', text);
    return;
  }

  const insights = await response.json();

  console.log('\n=== API Response: Category Performance ===');
  console.log('topCategories:', JSON.stringify(insights.topCategories, null, 2));
}

testCategoryPerformance().catch(console.error);
