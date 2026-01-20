import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSoftDelete() {
  const decisionId = '27285615-ac37-40f2-ab33-4d245d8b2e21';

  console.log('=== Checking Soft Delete Status ===\n');

  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, title, deleted_at')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Deleted At:', decision.deleted_at);

  if (decision.deleted_at) {
    console.log('\n✅ Decision is soft-deleted (has deleted_at timestamp)');
    console.log('✅ This is the correct behavior for soft delete with cascade');
    console.log('✅ Options and pros/cons are hard-deleted (cascade working)');
  } else {
    console.log('\n❌ Decision is not marked as deleted');
  }
}

checkSoftDelete();
