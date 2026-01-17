import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisions() {
  try {
    // Get user
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'session22test@example.com');

    if (!user) {
      console.error('User not found');
      return;
    }

    console.log('User ID:', user.id);

    // Get decisions for this user
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\nDecisions for session22test@example.com:');
    console.log('Count:', decisions.length);

    if (decisions.length > 0) {
      decisions.forEach((d, i) => {
        console.log(`\n${i + 1}. ${d.title}`);
        console.log('   ID:', d.id);
        console.log('   Status:', d.status);
        console.log('   Created:', d.created_at);
      });
    } else {
      console.log('No decisions found for this user');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDecisions();
