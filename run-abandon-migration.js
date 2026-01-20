// Apply migration using node-postgres directly
const { Client } = require('pg');

require('dotenv').config();

async function applyMigration() {
  // Parse Supabase connection string
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VUPABASE_DB_PASSWORD || process.env.VITE_SUPABASE_ANON_KEY;

  // Extract project ref from URL
  // https://doqojfsldvajmlscpwhu.supabase.co
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    console.error('Could not parse Supabase URL');
    process.exit(1);
  }

  const projectRef = match[1];
  const connectionString = `postgres://postgres.doqojfsldvajmlscpwhu:${process.env.DATABASE_PASSWORD || ''}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('Attempting to connect to database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL || connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if columns exist
    console.log('Checking if columns exist...');
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'decisions'
      AND column_name IN ('abandon_reason', 'abandon_note')
    `);

    if (checkResult.rows.length === 2) {
      console.log('✅ Columns already exist! Migration not needed.\n');
      await client.end();
      process.exit(0);
    }

    console.log('Applying migration...\n');

    // Add abandon_reason column
    console.log('Adding abandon_reason column...');
    await client.query(`
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50)
    `);
    console.log('✅ abandon_reason column added');

    // Add abandon_note column
    console.log('Adding abandon_note column...');
    await client.query(`
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS abandon_note TEXT
    `);
    console.log('✅ abandon_note column added');

    // Add comments
    console.log('Adding column comments...');
    await client.query(`
      COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions (e.g., "too_complex", "no_longer_relevant", "outside_influence")'
    `);
    await client.query(`
      COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned'
    `);
    console.log('✅ Comments added');

    console.log('\n✅ Migration applied successfully!\n');

    await client.end();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error applying migration:', err.message);

    if (err.message.includes('password') || err.code === 'ECONNREFUSED' || err.code === '28P01') {
      console.log('\n⚠️  Database connection failed.');
      console.log('\nTo apply this migration manually:');
      console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
      console.log('2. Run this SQL:');
      console.log(`
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';
      `);
    }

    await client.end().catch(() => {});
    process.exit(1);
  }
}

applyMigration();
