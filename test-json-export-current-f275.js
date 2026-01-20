const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'test_f275_all_fields@example.com';

async function testJsonExport() {
  console.log('Testing current JSON export implementation...\n');

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) throw userError;

  const user = users.find(u => u.email === TEST_EMAIL);
  if (!user) throw new Error(`User ${TEST_EMAIL} not found`);

  const userId = user.id;
  console.log('User ID:', userId);

  // Simulate current export implementation (from server.ts lines 1232-1266)
  console.log('\n--- Current Export (from server.ts) ---\n');

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    throw error;
  }

  console.log(`Found ${decisions.length} decisions\n`);

  // Check what data is included
  const firstDecision = decisions[0];
  console.log('First decision fields:', Object.keys(firstDecision).length, 'fields');
  console.log('Has options?', 'options' in firstDecision);
  console.log('Has pros_cons?', 'pros_cons' in firstDecision);
  console.log('Has category data?', 'category' in firstDecision || 'category_name' in firstDecision);
  console.log('Has outcomes?', 'outcomes' in firstDecision);

  console.log('\n--- Checking Database for Related Data ---\n');

  // Check if options exist for first decision
  const { data: options } = await supabase
    .from('options')
    .select('*')
    .eq('decision_id', firstDecision.id);

  console.log(`Options in DB for decision ${firstDecision.id.slice(0, 8)}...:`, options?.length || 0);

  // Check pros/cons
  if (options && options.length > 0) {
    const { data: prosCons } = await supabase
      .from('pros_cons')
      .select('*')
      .eq('option_id', options[0].id);

    console.log(`Pros/Cons in DB for option ${options[0].id.slice(0, 8)}...:`, prosCons?.length || 0);
  }

  console.log('\n--- Conclusion ---\n');
  console.log('❌ Current export does NOT include related data (options, pros/cons, category)');
  console.log('❌ This means JSON export is incomplete');
  console.log('\nTo fix, the export should use Supabase joins with select():');
  console.log('  select("*, options(*), category(*), outcomes(*)")');
}

testJsonExport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
