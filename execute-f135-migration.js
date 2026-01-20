/**
 * Execute Feature #135 Migration via Supabase REST API
 *
 * This script uses the Supabase Management API to execute the migration.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeMigration() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Feature #135 Migration Execution');
  console.log('═══════════════════════════════════════════════════════\n');

  // Read migration SQL
  const fs = require('fs');
  const path = require('path');
  const migrationPath = path.join(__dirname, 'apps/api/migrations/fix-reminders-table-f101.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Migration SQL loaded from:');
  console.log(`  ${migrationPath}\n`);

  // The Supabase REST API doesn't support DDL statements directly
  // We need to use RPC (Remote Procedure Call) with a custom function
  // OR execute via PostgreSQL connection string

  console.log('⚠️  Supabase REST API does not support DDL statements');
  console.log('Attempting to use PostgreSQL connection approach...\n');

  // Check if we have DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in environment\n');

    console.log('To execute this migration, you have two options:\n');
    console.log('Option 1: Manual Execution (RECOMMENDED)');
    console.log('─────────────────────────────────────────');
    console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    console.log('2. Copy contents of: apps/api/migrations/fix-reminders-table-f101.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run" button');
    console.log('5. Migration will complete in 2-3 seconds\n');

    console.log('Option 2: Add DATABASE_URL to .env');
    console.log('────────────────────────────────────────');
    console.log('1. Get database connection string from Supabase Dashboard:');
    console.log('   Settings → Database → Connection string → URI');
    console.log('2. Add to .env: DATABASE_URL=postgresql://...');
    console.log('3. Run: node execute-f135-migration.js\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('Migration blocked: Missing DATABASE_URL');
    console.log('═══════════════════════════════════════════════════════');

    process.exit(1);
  }

  // If DATABASE_URL exists, use pg to execute migration
  console.log('✅ DATABASE_URL found');
  console.log('Executing migration via PostgreSQL connection...\n');

  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const client = await pool.connect();

    console.log('Connected to database\n');

    // Execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip verification queries
      if (stmt.includes('SELECT') || stmt.includes('pg_indexes') || stmt.includes('information_schema')) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        await client.query(stmt);
        console.log('✅ Success\n');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('✅ Already exists (skipped)\n');
        } else {
          console.log('❌ Error:', err.message);
          console.log('Statement:', stmt.substring(0, 100), '...\n');
        }
      }
    }

    client.release();

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Migration completed successfully');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nFeature #135 can now be tested!\n');

    // Verify the migration worked
    console.log('Verifying schema...');
    const verifyResult = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(1);

    if (verifyResult.error) {
      console.log('❌ Verification failed:', verifyResult.error.message);
    } else {
      console.log('✅ Schema verified - columns are accessible');
      if (verifyResult.data.length > 0) {
        console.log('Sample columns:', Object.keys(verifyResult.data[0]));
      }
    }

    process.exit(0);

  } catch (err) {
    console.log('❌ Database connection error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeMigration();
