// Create test decision directly in database
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '../../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '1bcace3d-315a-4c2f-8751-e950fb21ff14'; // testdev@example.com

async function main() {
  try {
    // Try to find existing category first
    let { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('slug', 'testing')
      .single();

    if (!category) {
      // Create category if it doesn't exist
      const { data: newCategory, error: catError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Testing',
          slug: 'testing',
          icon: '🧪',
          color: '#00d4aa'
        })
        .select()
        .single();

      if (catError) {
        console.error('Category error:', catError);
        return;
      }
      category = newCategory;
      console.log('✓ Category created:', category.id);
    } else {
      console.log('✓ Using existing category:', category.id);
    }

    // Create decision
    const { data: decision, error: decError} = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: 'TEST_DECISION_12345_VERIFY_ME',
        status: 'draft',
        category_id: category.id,
        description: 'This is a test decision for Feature #31'
      })
      .select()
      .single();

    if (decError) {
      console.error('Decision error:', decError);
      return;
    }

    console.log('✓ Decision created:', decision.id);
    console.log('Title:', decision.title);
    console.log('Status:', decision.status);

    // Create options
    const { data: opt1, error: opt1Error } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: 'Option A',
        display_order: 0
      })
      .select()
      .single();

    if (opt1Error) {
      console.error('Option 1 error:', opt1Error);
      return;
    }

    const { data: opt2, error: opt2Error } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: 'Option B',
        display_order: 1
      })
      .select()
      .single();

    if (opt2Error) {
      console.error('Option 2 error:', opt2Error);
      return;
    }

    console.log('✓ Options created');

    // Create pros/cons
    await supabase.from('pros_cons').insert([
      { option_id: opt1.id, type: 'pro', content: 'Pro 1 for A', display_order: 0 },
      { option_id: opt1.id, type: 'con', content: 'Con 1 for A', display_order: 0 },
      { option_id: opt2.id, type: 'pro', content: 'Pro 1 for B', display_order: 0 },
      { option_id: opt2.id, type: 'con', content: 'Con 1 for B', display_order: 0 }
    ]);

    console.log('✓ Pros/Cons created');
    console.log('\nDecision ID for testing:', decision.id);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
