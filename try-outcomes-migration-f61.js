// Try to execute outcomes table migration using various approaches
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin privileges
  {
    db: { schema: 'public' }
  }
);

async function tryRPCExecution() {
  console.log('=== Attempt 1: Try RPC function execution ===\n');

  // Try to execute SQL via RPC if any function exists
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'SELECT 1 as test'
  });

  if (error) {
    console.log('❌ RPC exec_sql not available:', error.message);
    return false;
  }

  console.log('✅ RPC exec_sql available!');
  return true;
}

async function tryDirectMigration() {
  console.log('\n=== Attempt 2: Try direct table creation via client ===\n');

  // Read migration SQL
  const fs = require('fs');
  const path = require('path');
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'apps/api/migrations/create_outcomes_table.sql'),
    'utf8'
  );

  console.log('Migration SQL loaded. Attempting to execute...');

  // Try using pg library directly if we can get connection string
  try {
    // Construct PostgreSQL connection string from Supabase URL
    // Format: postgresql://postgres:[password]@[project].supabase.co:5432/postgres
    const { Pool } = require('pg');

    // We need the database password - let's check if it's available
    const dbPassword = process.env.SUPABASE_DB_PASSWORD ||
                       process.env.POSTGRES_PASSWORD ||
                       process.env.DATABASE_URL;

    if (!dbPassword) {
      console.log('❌ No database password found in environment');
      console.log('Need one of: SUPABASE_DB_PASSWORD, POSTGRES_PASSWORD, DATABASE_URL');
      return false;
    }

    const connectionString = `postgresql://postgres.doqojfsldvajmlscpwhu:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    console.log('Attempting to execute migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed successfully!');
    await pool.end();
    return true;

  } catch (err) {
    console.log('❌ Direct PostgreSQL connection failed:', err.message);
    return false;
  }
}

async function verifyTableExists() {
  console.log('\n=== Verification: Check if outcomes table now exists ===\n');

  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Table still does not exist:', error.message);
    return false;
  }

  console.log('✅ Outcomes table now exists!');
  console.log('Sample data:', data);
  return true;
}

async function main() {
  console.log('FEATURE #61 MIGRATION EXECUTION ATTEMPT\n');
  console.log('======================================\n');

  // Try RPC execution
  await tryRPCExecution();

  // Try direct migration
  const migrationSuccess = await tryDirectMigration();

  // Verify
  if (migrationSuccess) {
    const exists = await verifyTableExists();
    if (exists) {
      console.log('\n✅ SUCCESS: Outcomes table created!');
      console.log('Feature #61 can now be tested.');
      process.exit(0);
    }
  }

  console.log('\n❌ All automated approaches failed');
  console.log('\nMANUAL EXECUTION REQUIRED:');
  console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
  console.log('2. Open file: apps/api/migrations/create_outcomes_table.sql');
  console.log('3. Copy contents and paste into SQL Editor');
  console.log('4. Click "Run"');
  console.log('5. Verify no errors');
  console.log('\nAfter migration, Feature #61 will be testable immediately.');

  process.exit(1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
