/**
 * Execute the outcomes table migration using PostgreSQL client
 * This creates the outcomes table needed for Feature #77
 */

require('dotenv').config();
const { Client } = require('pg');

async function executeMigration() {
  // Construct DATABASE_URL from SUPABASE_URL if not set
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString && process.env.SUPABASE_URL) {
    // Convert Supabase URL to PostgreSQL connection string
    // Format: postgresql://postgres:[password]@host.supabase.co:5432/postgres
    const supabaseUrl = process.env.SUPABASE_URL;
    const password = process.env.SUPABASE_DB_PASSWORD || 'your-db-password';
    const host = supabaseUrl.replace('https://', '');
    connectionString = `postgresql://postgres:${password}@${host}:5432/postgres`;
  }

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('❌ SUPABASE_URL not found either');
    console.error('\nPlease set either:');
    console.error('  - DATABASE_URL=postgresql://postgres:password@host:5432/postgres');
    console.error('  - SUPABASE_DB_PASSWORD (will be used with SUPABASE_URL)');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Check if table exists first
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'outcomes'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ Outcomes table already exists! Skipping migration.');
      return;
    }

    // Read the migration SQL
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./apps/api/migrations/create_outcomes_table.sql', 'utf8');

    console.log('📜 Executing migration: create_outcomes_table.sql');
    console.log('---');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('---');
    console.log('✅ Migration executed successfully!');

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    const verifyResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'outcomes'
      );
    `);

    if (verifyResult.rows[0].exists) {
      console.log('✅ Table "outcomes" exists!');

      // Check columns
      const columnsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'outcomes'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Check indexes
      const indexesResult = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'outcomes';
      `);

      console.log('\n📇 Indexes:');
      indexesResult.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });

      // Check RLS
      const rlsResult = await client.query(`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'outcomes';
      `);

      console.log('\n🔒 Row Level Security:');
      console.log(`  - Enabled: ${rlsResult.rows[0].relrowsecurity ? '✅ Yes' : '❌ No'}`);

    } else {
      console.log('❌ Table "outcomes" was not created');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

executeMigration()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
