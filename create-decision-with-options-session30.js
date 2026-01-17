import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDecisionWithOptions() {
  // Get session30 user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === 'session30test@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Creating decision for user:', user.id);

  // Get a category ID (Career)
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Career')
    .single();

  const categoryId = categories?.id;

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      category_id: categoryId,
      title: 'Which job offer should I accept?',
      status: 'draft',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Decision created');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);

  // Create options
  const options = [
    { title: 'StartupCo - High risk, high reward', description: 'Equity stake but uncertain future' },
    { title: 'BigTech Corp - Stable and secure', description: 'Good salary and benefits' },
    { title: 'RemoteFirst Inc - Work from anywhere', description: 'Flexibility but lower pay' }
  ];

  for (const option of options) {
    const { data: createdOption, error: optionError } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: option.title,
        description: option.description
      })
      .select()
      .single();

    if (optionError) {
      console.error('Error creating option:', optionError);
    } else {
      console.log(`✅ Option created: ${createdOption.title}`);
    }
  }

  console.log('\n📊 Decision with options ready for testing!');
}

createDecisionWithOptions();
