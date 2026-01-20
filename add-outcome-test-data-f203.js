const { createClient } = require('@supabase/supabase-js');
const { crypto } = require('crypto');

// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '53be175d-164a-436b-83b7-f16b4a7441d4';

async function main() {
  // First, get or create a category
  let categoryId;
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', USER_ID)
    .limit(1);

  if (existingCategories && existingCategories.length > 0) {
    categoryId = existingCategories[0].id;
    console.log('Using existing category:', categoryId);
  } else {
    const { data: newCategory, error: catError } = await supabase
      .from('categories')
      .insert({
        user_id: USER_ID,
        name: 'Test Category F203',
        slug: 'test-category-f203',
        color: '#00d4aa',
        icon: '🎯'
      })
      .select()
      .single();

    if (catError) {
      console.error('Error creating category:', catError);
      throw catError;
    }

    categoryId = newCategory.id;
    console.log('Created category:', categoryId);
  }

  // Create 3 decisions with different outcomes
  const decisions = [
    {
      title: 'Test Decision - Better Outcome F203',
      outcome: 'better',
      satisfaction: 5,
      status: 'decided'
    },
    {
      title: 'Test Decision - As Expected Outcome F203',
      outcome: 'as_expected',
      satisfaction: 3,
      status: 'decided'
    },
    {
      title: 'Test Decision - Worse Outcome F203',
      outcome: 'worse',
      satisfaction: 1,
      status: 'decided'
    },
    {
      title: 'Test Decision - Better 2 F203',
      outcome: 'better',
      satisfaction: 4,
      status: 'decided'
    },
    {
      title: 'Test Decision - Worse 2 F203',
      outcome: 'worse',
      satisfaction: 2,
      status: 'decided'
    }
  ];

  for (const dec of decisions) {
    // Create decision
    const { data: decision, error: decError } = await supabase
      .from('decisions')
      .insert({
        user_id: USER_ID,
        category_id: categoryId,
        title: dec.title,
        status: dec.status || 'decided',
        detected_emotional_state: 'confident',
        decided_at: new Date().toISOString()
      })
      .select()
      .single();

    if (decError) {
      console.error('Error creating decision:', decError);
      continue;
    }

    console.log('Created decision:', decision.id, decision.title);

    // Create outcome - use lowercase 'outcomes' table
    const { data: outcome, error: outError } = await supabase
      .from('outcomes')
      .insert({
        decision_id: decision.id,
        result: dec.outcome,
        satisfaction: dec.satisfaction,
        learned: `Test notes for ${dec.title}`,
        recorded_at: new Date().toISOString(),
        check_in_number: 1
      })
      .select()
      .single();

    if (outError) {
      console.error('  Error creating outcome:', outError);
      // If outcomes table doesn't exist, store outcome on decision directly
      const { error: updateError } = await supabase
        .from('decisions')
        .update({
          outcome: dec.outcome,
          outcome_notes: `Test notes for ${dec.title}`,
          outcome_recorded_at: new Date().toISOString()
        })
        .eq('id', decision.id);

      if (updateError) {
        console.error('  Also failed to update decision with outcome:', updateError);
      } else {
        console.log('  Stored outcome on decision (legacy format)');
      }
      continue;
    }

    console.log('  Created outcome:', outcome.id, outcome.result);
  }

  console.log('\nCreated 5 decisions with different outcomes for testing!');
}

main();
