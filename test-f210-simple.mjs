/**
 * Simple test data creator for Feature #210
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-service-role-key';

// For actual use, replace with env vars
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL || supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey
);

async function main() {
  console.log('Getting test user...');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id')
    .limit(1);

  if (!profiles || profiles.length === 0) {
    console.error('No users found');
    return;
  }

  const userId = profiles[0].user_id;
  console.log(`User ID: ${userId}`);

  // Create category
  const { data: category } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'F210 Confidence Test',
      color: '#00d4aa',
    })
    .select()
    .single();

  console.log(`Category: ${category.id}`);

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

  for (const dec of decisions) {
    await supabase.from('decisions').insert({
      user_id: userId,
      title: dec.title,
      category_id: category.id,
      emotional_state: dec.emotion,
      confidence_level: dec.confidence,
      outcome: dec.outcome,
      status: 'reviewed',
    });
    console.log(`✓ ${dec.title}`);
  }

  console.log('\nCreated 11 test decisions');
  console.log('Expected: POSITIVE correlation (high confidence = better outcomes)');
}

main().catch(console.error);
