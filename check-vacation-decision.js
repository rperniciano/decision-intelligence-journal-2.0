/**
 * Check if vacation decision exists in database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecision() {
  // Get session18test user
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  const testUser = users.find(u => u.email === 'session18test@example.com');
  if (!testUser) {
    console.error('Test user not found');
    return;
  }

  console.log('Checking decisions for:', testUser.email);
  console.log('User ID:', testUser.id);

  // Get all decisions for this user
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', testUser.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching decisions:', error);
    return;
  }

  console.log('\nTotal decisions found:', decisions.length);

  if (decisions.length > 0) {
    console.log('\nDecisions:');
    decisions.forEach((d, i) => {
      console.log(`\n${i + 1}. ${d.title}`);
      console.log('   ID:', d.id);
      console.log('   Status:', d.status);
      console.log('   Category ID:', d.category_id);
      console.log('   Created:', d.created_at);
    });

    // Check if vacation decision exists
    const vacationDecision = decisions.find(d => d.title.includes('Vacation'));
    if (vacationDecision) {
      console.log('\n✅ Vacation decision found!');
      console.log('ID:', vacationDecision.id);

      // Check its options
      const { data: options } = await supabase
        .from('options')
        .select('*, pros_cons(*)')
        .eq('decision_id', vacationDecision.id);

      console.log('Options:', options?.length || 0);
      if (options) {
        options.forEach(opt => {
          console.log(`\n  - ${opt.title}`);
          const pros = opt.pros_cons.filter(pc => pc.type === 'pro');
          const cons = opt.pros_cons.filter(pc => pc.type === 'con');
          console.log(`    Pros: ${pros.length}, Cons: ${cons.length}`);
        });
      }
    }
  } else {
    console.log('No decisions found for this user!');
  }
}

checkDecision();
