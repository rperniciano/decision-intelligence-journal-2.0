/**
 * Direct migration for Feature #88 using node-postgres
 * Execute this with: node run-migration-f88-direct.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Construct PostgreSQL connection string from Supabase URL
// Format: postgresql://postgres:[password]@host:5432/postgres
const supabaseUrl = process.env.SUPABASE_URL; // e.g., https://doqojfsldvajmlscpwhu.supabase.co
const projectId = supabaseUrl?.replace('https://', '').replace('.supabase.co', '');
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!projectId) {
  console.error('❌ Could not extract project ID from SUPABASE_URL');
  process.exit(1);
}

console.log('🚀 Feature #88 Migration\n');
console.log('📋 Project ID:', projectId);

// Try using the service role key as database password
// The connection string format for Supabase is:
// postgresql://postgres.project_id:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

const connectionString = `postgresql://postgres.${projectId}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

console.log('🔗 Connection string constructed');

const client = new pg.Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check if columns exist
    console.log('🔍 Checking if columns exist...');
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

    console.log('📝 Columns do not exist. Running migration...\n');

    // Run migration
    console.log('Adding abandon_reason column...');
    await client.query(`
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);
    `);
    console.log('✅ abandon_reason added');

    console.log('Adding abandon_note column...');
    await client.query(`
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_note TEXT;
    `);
    console.log('✅ abandon_note added');

    console.log('\n✅ Migration completed successfully!\n');

    // Verify
    const verifyResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'decisions'
      AND column_name IN ('abandon_reason', 'abandon_note')
      ORDER BY column_name;
    `);

    console.log('📊 Verified columns:');
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    await client.end();
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nHint: If authentication failed, you may need to set SUPABASE_DB_PASSWORD');
    console.error('Get the password from: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/settings/database');

    try {
      await client.end();
    } catch (e) {
      // Ignore
    }
    return false;
  }
}

runMigration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
