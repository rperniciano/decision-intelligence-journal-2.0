const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// This script attempts to create the outcomes table using direct SQL queries
// Note: This requires Supabase database URL with direct PostgreSQL access

const { Pool } = require('pg');

// Extract database connection details from Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;
const projectRef = supabaseUrl.split('//')[1].split('.')[0];

// Construct PostgreSQL connection string
// Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('Note: This requires SUPABASE_DB_PASSWORD environment variable');
console.log('You can find this in: Supabase Dashboard > Project Settings > Database > Connection string');

if (!process.env.SUPABASE_DB_PASSWORD) {
  console.log('\n❌ SUPABASE_DB_PASSWORD not set in .env file');
  console.log('\nAlternative: Run the migration manually in Supabase SQL Editor:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Paste the contents of migration-add-outcomes-tables.sql');
  console.log('3. Click "Run"');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('✓ Connected to database');

    // Read migration file
    const fs = require('fs');
    const sql = fs.readFileSync('migration-add-outcomes-tables.sql', 'utf8');

    // Execute migration
    await client.query(sql);
    console.log('✓ Migration executed successfully');

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease run the migration manually in Supabase SQL Editor');
    process.exit(1);
  }
})();
