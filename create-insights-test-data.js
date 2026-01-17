// Create test decisions for insights pattern verification
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://doqojfsldvajmlscpwhu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const USER_ID = '0f2bd7bf-53c1-4713-b1ba-5e14430853bf'; // session18test user

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function createDecisionsWithOutcomes() {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Get a real category ID first
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .limit(1)
    .single();

  const categoryId = categories?.id || '00000000-0000-0000-0000-000000000001';

  const decisions = [
    // Positive outcomes - recent
    {
      title: 'INSIGHTS_TEST_POSITIVE_1',
      description: 'Decided to exercise daily',
      status: 'decided',
      category_id: categoryId,
      user_id: USER_ID,
      detected_emotional_state: 'confident',
      outcome: 'better',
      outcome_notes: 'Feeling much healthier',
      outcome_recorded_at: new Date(now - 1 * dayMs).toISOString(),
      created_at: new Date(now - 30 * dayMs).toISOString()
    },
    {
      title: 'INSIGHTS_TEST_POSITIVE_2',
      description: 'Switched to earlier bedtime',
      status: 'decided',
      category_id: categoryId,
      user_id: USER_ID,
      detected_emotional_state: 'hopeful',
      outcome: 'better',
      outcome_notes: 'More energy throughout the day',
      outcome_recorded_at: new Date(now - 2 * dayMs).toISOString(),
      created_at: new Date(now - 25 * dayMs).toISOString()
    },
    {
      title: 'INSIGHTS_TEST_POSITIVE_3',
      description: 'Started meditation practice',
      status: 'decided',
      category_id: categoryId,
      user_id: USER_ID,
      detected_emotional_state: 'calm',
      outcome: 'better',
      outcome_notes: 'Much less stressed',
      outcome_recorded_at: new Date(now - 3 * dayMs).toISOString(),
      created_at: new Date(now - 20 * dayMs).toISOString()
    },
    // Negative outcomes
    {
      title: 'INSIGHTS_TEST_NEGATIVE_1',
      description: 'Took on extra project',
      status: 'decided',
      category_id: categoryId,
      user_id: USER_ID,
      detected_emotional_state: 'anxious',
      outcome: 'worse',
      outcome_notes: 'Too much stress, burned out',
      outcome_recorded_at: new Date(now - 5 * dayMs).toISOString(),
      created_at: new Date(now - 15 * dayMs).toISOString()
    },
    {
      title: 'INSIGHTS_TEST_NEGATIVE_2',
      description: 'Skipped vacation plans',
      status: 'decided',
      category_id: categoryId,
      user_id: USER_ID,
      detected_emotional_state: 'uncertain',
      outcome: 'worse',
      outcome_notes: 'Regret not taking time off',
      outcome_recorded_at: new Date(now - 7 * dayMs).toISOString(),
      created_at: new Date(now - 10 * dayMs).toISOString()
    },
    // As expected outcome
    {
      title: 'INSIGHTS_TEST_AS_EXPECTED_1',
      description: 'Changed coffee brand',
      status: 'decided',
      category_id: categoryId,
      user_id: USER_ID,
      detected_emotional_state: 'neutral',
      outcome: 'as_expected',
      outcome_notes: 'No noticeable difference',
      outcome_recorded_at: new Date(now - 4 * dayMs).toISOString(),
      created_at: new Date(now - 12 * dayMs).toISOString()
    },
    // Recent decision without outcome
    {
      title: 'INSIGHTS_TEST_NO_OUTCOME_1',
      description: 'Considering new job offer',
      status: 'decided',
      category_id: categoryId,
      user_id: USER_ID,
      detected_emotional_state: 'excited',
      created_at: new Date(now - 1 * dayMs).toISOString()
    }
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert([decision])
      .select();

    if (error) {
      console.error(`Error creating ${decision.title}:`, error);
    } else {
      console.log(`✓ Created ${decision.title}`);
    }
  }

  console.log('\nTest data created successfully!');
  console.log('Summary:');
  console.log('- 3 decisions with positive outcomes (better)');
  console.log('- 2 decisions with negative outcomes (worse)');
  console.log('- 1 decision with as_expected outcome');
  console.log('- 1 recent decision without outcome');
}

createDecisionsWithOutcomes().catch(console.error);
