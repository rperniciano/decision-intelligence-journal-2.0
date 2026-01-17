// Run migration using Supabase REST API directly
// Session 38 - Complete Feature #88

import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('Running abandon fields migration via Supabase REST API...\n');

  const statements = [
    `ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);`,
    `ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT;`
  ];

  for (const statement of statements) {
    console.log(`Executing: ${statement}`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: statement })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);

      if (error.includes('function') || error.includes('does not exist')) {
        console.log('\n⚠️  exec_sql RPC function not available');
        console.log('This is expected - Supabase JS cannot run DDL directly');
        console.log('\n📋 MANUAL MIGRATION REQUIRED:');
        console.log('1. Open Supabase Dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Paste and run this SQL:\n');
        console.log('ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);');
        console.log('ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT;');
        return false;
      }
    } else {
      const data = await response.json();
      console.log('✅ Success:', data);
    }
  }

  return true;
}

runMigration()
  .then(success => {
    if (!success) {
      console.log('\n⚠️  Migration needs manual execution in Supabase Dashboard');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
