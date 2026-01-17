// Check existing decisions in database
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisions() {
  const email = 'session73test@example.com';

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('User not found');
    return;
  }

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, status, outcome')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${decisions.length} decisions:`);
  decisions.forEach(d => {
    console.log(`- ${d.title} (status: ${d.status}, outcome: ${d.outcome || 'none'})`);
  });
}

checkDecisions();
