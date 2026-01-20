/**
 * Direct test data creation for Feature #210 using Supabase REST API
 * Uses service role key to bypass authentication
 */

import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

async function main() {
  console.log('=== Feature #210 Test Data Creation ===\n');

  // First, get an existing user from profiles table
  const profilesRes = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    }
  });

  const profiles = await profilesRes.json();

  if (!profiles || profiles.length === 0) {
    console.error('No users found in profiles table');
    console.log('Please create a user account first via the UI');
    process.exit(1);
  }

  console.log('Profile data:', JSON.stringify(profiles[0], null, 2));

  const userId = profiles[0].user_id || profiles[0].id;
  if (!userId) {
    console.error('Could not extract user_id from profile');
    process.exit(1);
  }
  console.log(`Using user ID: ${userId}\n`);

  // Create category or use existing one
  let categoryId;

  // Try to get existing category
  const existingCatRes = await fetch(`${supabaseUrl}/rest/v1/categories?user_id=eq.${userId}&slug=eq.f210-confidence-test`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    }
  });

  const existingCats = await existingCatRes.json();

  if (existingCats && existingCats.length > 0) {
    categoryId = existingCats[0].id;
    console.log(`✓ Using existing category: ${categoryId}\n`);
  } else {
    // Create new category
    const categoryRes = await fetch(`${supabaseUrl}/rest/v1/categories`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        name: 'F210 Confidence Test',
        slug: 'f210-confidence-test',
        color: '#00d4aa',
      })
    });

    if (!categoryRes.ok) {
      console.error('Failed to create category:', await categoryRes.text());
      process.exit(1);
    }

    const categories = await categoryRes.json();
    categoryId = categories[0].id;
    console.log(`✓ Created category: ${categoryId}\n`);
  }

  // Create test decisions
  const decisions = [
    { title: 'F210 Low #1 - BAD', confidence: 1, outcome: 'worse', emotion: 'uncertain' },
    { title: 'F210 Low #2 - BAD', confidence: 2, outcome: 'worse', emotion: 'anxious' },
    { title: 'F210 Low #3 - GOOD', confidence: 2, outcome: 'better', emotion: 'uncertain' },
    { title: 'F210 Low #4 - GOOD', confidence: 1, outcome: 'better', emotion: 'neutral' },
    { title: 'F210 Med #1 - BAD', confidence: 3, outcome: 'worse', emotion: 'neutral' },
    { title: 'F210 Med #2 - GOOD', confidence: 3, outcome: 'better', emotion: 'calm' },
    { title: 'F210 Med #3 - GOOD', confidence: 3, outcome: 'better', emotion: 'neutral' },
    { title: 'F210 High #1 - GOOD', confidence: 5, outcome: 'better', emotion: 'confident' },
    { title: 'F210 High #2 - GOOD', confidence: 4, outcome: 'better', emotion: 'confident' },
    { title: 'F210 High #3 - GOOD', confidence: 5, outcome: 'better', emotion: 'confident' },
    { title: 'F210 High #4 - GOOD', confidence: 4, outcome: 'better', emotion: 'confident' },
  ];

  console.log('Creating 11 test decisions...\n');

  let count = 0;
  for (const dec of decisions) {
    const res = await fetch(`${supabaseUrl}/rest/v1/decisions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title: dec.title,
        category_id: categoryId,
        emotional_state: dec.emotion,
        confidence_level: dec.confidence,
        outcome: dec.outcome,
        status: 'reviewed',
      })
    });

    if (res.ok) {
      count++;
      const confLabel = dec.confidence <= 2 ? 'LOW' : dec.confidence === 3 ? 'MED' : 'HIGH';
      const outcomeLabel = dec.outcome === 'better' ? '✓' : '✗';
      console.log(`  ${count}. ${dec.title}`);
      console.log(`     Confidence: ${dec.confidence}/5 (${confLabel}) | Outcome: ${dec.outcome} ${outcomeLabel}`);
    } else {
      const error = await res.text();
      console.error(`  ✗ Failed to create: ${dec.title}`);
      console.error(`     Error: ${error}`);
    }
  }

  console.log(`\n✅ Created ${count}/${decisions.length} test decisions\n`);
  console.log('Expected correlation pattern:');
  console.log('  - Low confidence (1-2): 50% success rate (2/4)');
  console.log('  - Medium confidence (3): 67% success rate (2/3)');
  console.log('  - High confidence (4-5): 100% success rate (4/4)');
  console.log('  - Correlation: POSITIVE\n');
  console.log('Now visit http://localhost:5173/insights to see the Confidence Correlation card!\n');
}

main().catch(console.error);
