/**
 * Test script for Feature #210: Confidence vs Outcome Correlation
 *
 * This script creates test decisions with different confidence levels and outcomes
 * to verify the confidence correlation pattern is calculated correctly.
 *
 * Expected pattern: Should show correlation between confidence and outcome
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== Feature #210 Test Data: Confidence vs Outcome Correlation ===\n');

  // Get a test user
  const { data: users } = await supabase
    .from('profiles')
    .select('user_id')
    .limit(1);

  if (!users || users.length === 0) {
    console.error('No users found. Please create a user first.');
    process.exit(1);
  }

  const userId = users[0].user_id;
  console.log(`Using user ID: ${userId}`);

  // Create a category for test decisions
  const { data: category } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'F210 Confidence Test',
      color: '#00d4aa',
    })
    .select()
    .single();

  const categoryId = category.id;
  console.log(`Created category: ${categoryId}`);

  // Test data: Decisions with confidence levels and outcomes
  // Pattern: Low confidence = 50% success, High confidence = 80% success (positive correlation)
  const testDecisions = [
    {
      title: 'F210 Low Confidence #1 - BAD',
      category: categoryId,
      emotional_state: 'uncertain',
      confidence_level: 1, // LOW
      outcome: 'worse',
      status: 'reviewed',
    },
    {
      title: 'F210 Low Confidence #2 - BAD',
      category: categoryId,
      emotional_state: 'anxious',
      confidence_level: 2, // LOW
      outcome: 'worse',
      status: 'reviewed',
    },
    {
      title: 'F210 Low Confidence #3 - GOOD',
      category: categoryId,
      emotional_state: 'uncertain',
      confidence_level: 2, // LOW
      outcome: 'better',
      status: 'reviewed',
    },
    {
      title: 'F210 Low Confidence #4 - GOOD',
      category: categoryId,
      emotional_state: 'neutral',
      confidence_level: 1, // LOW
      outcome: 'better',
      status: 'reviewed',
    },

    {
      title: 'F210 Medium Confidence #1 - BAD',
      category: categoryId,
      emotional_state: 'neutral',
      confidence_level: 3, // MEDIUM
      outcome: 'worse',
      status: 'reviewed',
    },
    {
      title: 'F210 Medium Confidence #2 - GOOD',
      category: categoryId,
      emotional_state: 'calm',
      confidence_level: 3, // MEDIUM
      outcome: 'better',
      status: 'reviewed',
    },
    {
      title: 'F210 Medium Confidence #3 - GOOD',
      category: categoryId,
      emotional_state: 'neutral',
      confidence_level: 3, // MEDIUM
      outcome: 'better',
      status: 'reviewed',
    },

    {
      title: 'F210 High Confidence #1 - GOOD',
      category: categoryId,
      emotional_state: 'confident',
      confidence_level: 5, // HIGH
      outcome: 'better',
      status: 'reviewed',
    },
    {
      title: 'F210 High Confidence #2 - GOOD',
      category: categoryId,
      emotional_state: 'confident',
      confidence_level: 4, // HIGH
      outcome: 'better',
      status: 'reviewed',
    },
    {
      title: 'F210 High Confidence #3 - GOOD',
      category: categoryId,
      emotional_state: 'confident',
      confidence_level: 5, // HIGH
      outcome: 'better',
      status: 'reviewed',
    },
    {
      title: 'F210 High Confidence #4 - GOOD',
      category: categoryId,
      emotional_state: 'confident',
      confidence_level: 4, // HIGH
      outcome: 'better',
      status: 'reviewed',
    },
  ];

  console.log(`\nCreating ${testDecisions.length} test decisions...\n`);

  let createdCount = 0;
  for (const decision of testDecisions) {
    const { error } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: decision.title,
        category_id: decision.category,
        emotional_state: decision.emotional_state,
        confidence_level: decision.confidence_level,
        outcome: decision.outcome,
        status: decision.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`Error creating "${decision.title}":`, error.message);
    } else {
      createdCount++;
      const confidenceLabel = decision.confidence_level <= 2 ? 'LOW' :
                             decision.confidence_level === 3 ? 'MED' : 'HIGH';
      const outcomeLabel = decision.outcome === 'better' ? '✓' : '✗';
      console.log(`  ${createdCount}. ${decision.title}`);
      console.log(`     Confidence: ${decision.confidence_level}/5 (${confidenceLabel}) | Outcome: ${decision.outcome} ${outcomeLabel}`);
    }
  }

  console.log(`\n✅ Successfully created ${createdCount}/${testDecisions.length} test decisions`);
  console.log('\nExpected correlation pattern:');
  console.log('  - Low confidence (1-2): 50% success rate (2/4)');
  console.log('  - Medium confidence (3): 67% success rate (2/3)');
  console.log('  - High confidence (4-5): 100% success rate (4/4)');
  console.log('  - Correlation: POSITIVE (higher confidence → better outcomes)');
  console.log('\nTest data ready for Feature #210 verification!\n');
}

main().catch(console.error);
