/**
 * Direct PostgreSQL migration for Feature #88
 * Uses direct TCP connection to Supabase PostgreSQL
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function runMigration() {
  console.log('🚀 Feature #88 Migration\n');

  // Get project ID from Supabase URL
  const supabaseUrl = process.env.SUPABASE_URL;
  const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  console.log('📋 Project:', projectId);

  // Try multiple connection methods
  const connectionMethods = [
    {
      name: 'Direct pooler (port 6543)',
      connectionString: `postgres://postgres.${projectId}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
    },
    {
      name: 'Pooler (port 5432)',
      connectionString: `postgres://postgres.${projectId}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
    },
    {
      name: 'Direct connection (port 5432)',
      connectionString: `postgres://postgres.${projectId}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectId}.supabase.co:5432/postgres`
    }
  ];

  let client = null;
  let connectedMethod = null;

  for (const method of connectionMethods) {
    try {
      console.log(`\n🔌 Trying: ${method.name}`);

      client = new Client({
        connectionString: method.connectionString,
        ssl: {
          rejectUnauthorized: false,
          mode: 'require'
        },
        connectionTimeoutMillis: 10000
      });

      await client.connect();
      connectedMethod = method;
      console.log(`✅ Connected via ${method.name}!`);
      break;

    } catch (error) {
      console.log(`❌ Failed: ${error.message.split('\n')[0]}`);
      if (client) {
        try { client.end(); } catch (e) {}
        client = null;
      }
    }
  }

  if (!client) {
    console.log('\n❌ All connection methods failed.');
    console.log('\n🔧 Alternative: Execute SQL manually in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
    console.log('SQL to execute:');
    console.log('─'.repeat(70));
    console.log(`ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';`);
    console.log('─'.repeat(70));
    return false;
  }

  try {
    // Check if columns exist
    console.log('\n🔍 Checking if columns exist...');
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'decisions'
      AND column_name IN ('abandon_reason', 'abandon_note');
    `);

    if (checkResult.rows.length >= 2) {
      console.log('✅ Columns already exist!\n');
      await client.end();
      return true;
    }

    console.log('📝 Columns missing. Running migration...\n');

    // Add abandon_reason column
    console.log('Adding abandon_reason column...');
    await client.query(`
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);
    `);
    console.log('✅ abandon_reason added');

    // Add abandon_note column
    console.log('Adding abandon_note column...');
    await client.query(`
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_note TEXT;
    `);
    console.log('✅ abandon_note added');

    // Add comments
    console.log('\nAdding column comments...');
    await client.query(`
      COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
    `);
    await client.query(`
      COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';
    `);
    console.log('✅ Comments added');

    // Verify
    console.log('\n🔍 Verifying migration...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'decisions'
      AND column_name IN ('abandon_reason', 'abandon_note')
      ORDER BY column_name;
    `);

    console.log('\n📊 Migration results:');
    verifyResult.rows.forEach(row => {
      const type = row.character_maximum_length
        ? `${row.data_type}(${row.character_maximum_length})`
        : row.data_type;
      console.log(`   ✓ ${row.column_name}: ${type}`);
    });

    console.log('\n🎉 Feature #88 database migration complete!\n');
    await client.end();
    return true;

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    await client.end();
    return false;
  }
}

runMigration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
