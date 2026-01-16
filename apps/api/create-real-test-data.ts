// Create test decision with proper schema
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_USER_ID = '1bcace3d-315a-4c2f-8751-e950fb21ff14';

async function main() {
  try {
    // 1. Create or get a category
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'Career')
      .limit(1);

    let categoryId: string;

    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
      console.log('✓ Using existing Career category:', categoryId);
    } else {
      const { data: newCategory, error: catError } = await supabase
        .from('categories')
        .insert({
          user_id: TEST_USER_ID,
          name: 'Career',
          slug: 'career',
          icon: '💼',
          color: '#00d4aa'
        })
        .select()
        .single();

      if (catError) throw catError;
      categoryId = newCategory.id;
      console.log('✓ Created Career category:', categoryId);
    }

    // 2. Create a decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: TEST_USER_ID,
        title: 'Should I switch to TypeScript?',
        description: 'Considering whether to invest time in learning TypeScript for better career prospects.',
        raw_transcript: 'I have been thinking about whether I should invest time in learning TypeScript or just stick with JavaScript. TypeScript offers better type safety and is becoming the industry standard, but I am concerned about the learning curve.',
        category_id: categoryId,
        detected_emotional_state: null,
        status: 'draft',
        tags: ['programming', 'career-development', 'learning']
      })
      .select()
      .single();

    if (decisionError) throw decisionError;
    console.log('✓ Created decision:', decision.id);

    // 3. Create options
    const option1Data = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: 'Learn TypeScript',
        display_order: 1
      })
      .select()
      .single();

    if (option1Data.error) throw option1Data.error;
    const option1Id = option1Data.data.id;
    console.log('✓ Created option 1:', option1Id);

    const option2Data = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: 'Stay with JavaScript',
        display_order: 2
      })
      .select()
      .single();

    if (option2Data.error) throw option2Data.error;
    const option2Id = option2Data.data.id;
    console.log('✓ Created option 2:', option2Id);

    // 4. Create pros/cons for option 1
    await supabase.from('pros_cons').insert([
      { option_id: option1Id, type: 'pro', content: 'Better type safety', display_order: 1 },
      { option_id: option1Id, type: 'pro', content: 'Industry standard', display_order: 2 },
      { option_id: option1Id, type: 'pro', content: 'Improved IDE support', display_order: 3 },
      { option_id: option1Id, type: 'con', content: 'Learning curve', display_order: 1 },
      { option_id: option1Id, type: 'con', content: 'More verbose code', display_order: 2 }
    ]);
    console.log('✓ Created pros/cons for option 1');

    // 5. Create pros/cons for option 2
    await supabase.from('pros_cons').insert([
      { option_id: option2Id, type: 'pro', content: 'Already familiar', display_order: 1 },
      { option_id: option2Id, type: 'pro', content: 'Faster development', display_order: 2 },
      { option_id: option2Id, type: 'con', content: 'Harder to catch bugs', display_order: 1 },
      { option_id: option2Id, type: 'con', content: 'Less tooling support', display_order: 2 }
    ]);
    console.log('✓ Created pros/cons for option 2');

    console.log('\n✅ Test data created successfully!');
    console.log('Decision ID:', decision.id);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
