/**
 * Feature #88 Migration - Execute via Supabase REST API
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL; // e.g., https://doqojfsldvajmlscpwhu.supabase.co
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🚀 Feature #88 Migration\n');
console.log('⚠️  Supabase REST API does not support executing arbitrary SQL for security reasons.');
console.log('\n🔧 Manual Steps Required:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
console.log('2. Paste and execute this SQL:\n');
console.log('─'.repeat(70));
console.log(`-- Migration to add abandonment support (Feature #88)

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';`);
console.log('─'.repeat(70));
console.log('\n3. After executing, run: node verify-migration-f88.js\n');

// Now let's verify by trying to query the columns
console.log('🔍 Verifying if columns exist...');

async function verifyColumns() {
  const response = await fetch(`${supabaseUrl}/rest/v1/decisions?select=abandon_reason,abandon_note&limit=1`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Columns exist! Migration already applied.\n');
    return true;
  }

  const errorText = await response.text();
  if (errorText.includes('column') || errorText.includes('does not exist')) {
    console.log('❌ Columns do not exist. Please execute the SQL above.\n');
    return false;
  }

  console.log('⚠️  Could not verify:', errorText);
  return false;
}

verifyColumns().then(exists => {
  if (exists) {
    console.log('🎉 Feature #88 database migration is complete!\n');
    console.log('You can now test the abandon feature.\n');
  }
  process.exit(exists ? 0 : 1);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
