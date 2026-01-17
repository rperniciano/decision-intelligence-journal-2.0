// Run migration using direct PostgreSQL connection
// Session 38 - Complete Feature #88

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  console.log('Running abandon fields migration via PostgreSQL...\n');

  // Extract project reference from Supabase URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1];

  // Construct connection string
  // For Supabase, use: postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  const connectionString = `postgres://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Read migration SQL
    const sql = fs.readFileSync('migration-add-abandon-fields.sql', 'utf8');

    console.log('Executing migration SQL:');
    console.log(sql);
    console.log('\n');

    // Execute the full migration
    await client.query(sql);

    console.log('✅ Migration executed successfully\n');

    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'decisions'
        AND column_name IN ('abandon_reason', 'abandon_note')
      ORDER BY column_name;
    `);

    console.log('Verification - New columns in decisions table:');
    console.table(result.rows);

    if (result.rows.length === 2) {
      console.log('\n✅ DATABASE MIGRATION SUCCESSFUL');
      console.log('Both abandon_reason and abandon_note columns added to decisions table');
      return true;
    } else {
      console.log('\n⚠️  Expected 2 columns, found', result.rows.length);
      return false;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('\n⚠️  Database connection failed');
      console.log('Make sure SUPABASE_DB_PASSWORD is set in .env file');
      console.log('Get it from: Supabase Dashboard → Settings → Database → Connection String');
    }

    return false;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

runMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
