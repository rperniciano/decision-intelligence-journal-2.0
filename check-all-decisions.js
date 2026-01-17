import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisions() {
  const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd'; // mobiletest user

  // Get all decisions (including deleted)
  const { data: allDecisions, error: allError } = await supabase
    .from('decisions')
    .select('id, title, status, deleted_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('Error fetching all decisions:', allError);
    process.exit(1);
  }

  console.log('\n=== ALL DECISIONS (including deleted) ===');
  console.log(`Total: ${allDecisions.length}`);
  allDecisions.forEach(d => {
    console.log(`- ${d.title} | Status: ${d.status} | Deleted: ${d.deleted_at ? 'YES' : 'NO'}`);
  });

  // Get non-deleted decisions
  const { data: activeDecisions, error: activeError } = await supabase
    .from('decisions')
    .select('id, title, status')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (activeError) {
    console.error('Error fetching active decisions:', activeError);
    process.exit(1);
  }

  console.log('\n=== ACTIVE DECISIONS (not deleted) ===');
  console.log(`Total: ${activeDecisions.length}`);
  activeDecisions.forEach(d => {
    console.log(`- ${d.title} | Status: ${d.status}`);
  });
}

checkDecisions();
