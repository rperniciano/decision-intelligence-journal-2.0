// Attempt to execute migration using pg client directly
// This requires the database password which we don't have

const { Client } = require('pg');

async function executeMigrationWithPg() {
  console.log('Attempting PostgreSQL direct connection...\n');

  // Standard Supabase PostgreSQL connection string format
  // postgresql://postgres:[YOUR-PASSWORD]@db.doqojfsldvajmlscpwhu.supabase.co:5432/postgres

  const password = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD;

  if (!password) {
    console.log('❌ Database password not found in environment variables\n');
    console.log('Required: SUPABASE_DB_PASSWORD or DATABASE_PASSWORD');
    console.log('\nTo get the password:');
    console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/settings/database');
    console.log('2. Scroll to "Connection string"');
    console.log('3. Copy the password from the URI');
    console.log('4. Add to .env: SUPABASE_DB_PASSWORD=<password>');
    console.log('\nThen run this script again.');
    return false;
  }

  const connectionString = `postgresql://postgres:${password}@db.doqojfsldvajmlscpwhu.supabase.co:5432/postgres`;

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('Executing migration...\n');
    await client.query(`ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);`);
    console.log('✅ Added abandon_reason column');

    await client.query(`ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT;`);
    console.log('✅ Added abandon_note column');

    await client.query(`COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';`);
    await client.query(`COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note for abandoned decisions';`);
    console.log('✅ Added comments\n');

    console.log('✅ Migration completed successfully!\n');
    console.log('Feature #88 is now ready to test!');

    await client.end();
    return true;

  } catch (error) {
    console.log('❌ Error:', error.message);
    await client.end();
    return false;
  }
}

executeMigrationWithPg();
