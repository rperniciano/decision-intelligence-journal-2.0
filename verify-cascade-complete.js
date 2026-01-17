import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCleanup() {
  const decisionId = '8a905612-4251-4b15-8cbd-dc99b4b63cdd';
  const optionIds = [
    '4c507be3-6db9-4242-9242-f30a522170d7',
    'a71cb118-8ea1-4a68-a221-7dbace7e7640'
  ];
  const prosConsIds = [
    'dfa2dd1f-b15f-4445-8331-d190af74692a',
    '28387b77-b387-4729-bd47-6caf9c0785ed',
    '4f2d1a85-bc64-4e54-b565-702b4354b492',
    'e70b96c2-af21-46b3-a1e7-1b2b11955b2f'
  ];

  try {
    // Check decision
    const { data: decision } = await supabase
      .from('decisions')
      .select('id')
      .eq('id', decisionId);

    console.log('✓ Decision exists:', decision && decision.length > 0 ? 'NO (deleted)' : 'YES (still exists)');
    console.log('  Count:', decision?.length || 0);

    // Check options
    const { data: options } = await supabase
      .from('options')
      .select('id')
      .in('id', optionIds);

    console.log('\n✓ Options exist:', options && options.length > 0 ? `YES (${options.length} orphaned!)` : 'NO (cascade deleted)');
    console.log('  Expected: 0, Actual:', options?.length || 0);

    // Check pros/cons
    const { data: prosCons } = await supabase
      .from('pros_cons')
      .select('id')
      .in('id', prosConsIds);

    console.log('\n✓ Pros/Cons exist:', prosCons && prosCons.length > 0 ? `YES (${prosCons.length} orphaned!)` : 'NO (cascade deleted)');
    console.log('  Expected: 0, Actual:', prosCons?.length || 0);

    console.log('\n=== CASCADE DELETE TEST RESULTS ===');
    const allClean = !decision?.length && !options?.length && !prosCons?.length;
    if (allClean) {
      console.log('✅ PASS: All related records cascade deleted');
      console.log('   - Decision removed');
      console.log('   - 2 options removed');
      console.log('   - 4 pros/cons removed');
    } else {
      console.log('❌ FAIL: Orphaned records found');
      if (decision?.length) console.log('   - Decision still exists');
      if (options?.length) console.log('   - Options orphaned:', options.length);
      if (prosCons?.length) console.log('   - Pros/cons orphaned:', prosCons.length);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyCleanup();
