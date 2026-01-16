// Check what tables exist
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable(tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.log(`❌ ${tableName}: ${error.message}`);
  } else {
    console.log(`✅ ${tableName}: exists`);
    if (data && data.length > 0) {
      console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
    }
  }
}

async function main() {
  console.log('Checking tables...\n');
  await checkTable('decisions');
  await checkTable('options');
  await checkTable('decision_options');
  await checkTable('pros_cons');
  await checkTable('categories');
}

main();
