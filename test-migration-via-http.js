/**
 * Attempt to apply migration via direct HTTP request to Supabase REST API
 */

require('dotenv').config();
const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref
const projectRef = supabaseUrl.match(/https:\/\/([\w-]+)\.supabase\.co/)[1];

console.log('🔧 Attempting to apply migration via Supabase REST API...\n');
console.log(`Project: ${projectRef}`);

// SQL to execute
const sql = `
-- Add abandon_reason column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

-- Add abandon_note column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Add comments
COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';
`;

// Try to use the /rpc/v1 endpoint with pgsql
const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/execute_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer': 'return=representation'
  }
};

console.log('\n⚠️  Note: Supabase REST API does NOT support DDL (ALTER TABLE) operations via /rpc');
console.log('⚠️  This endpoint is for CRUD operations only, not schema modifications\n');

console.log('📋 Manual migration is required:');
console.log('─'.repeat(70));
console.log('1. Visit Supabase SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql\n`);
console.log('2. Execute this SQL:\n');
console.log(sql);
console.log('─'.repeat(70));

console.log('\n❌ Cannot automate DDL operations via REST API');
console.log('⛔ Feature #88 remains BLOCKED pending manual migration\n');

process.exit(1);
