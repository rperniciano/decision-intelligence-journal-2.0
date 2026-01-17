const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

// Use PostgreSQL connection directly
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function addConfidenceLevelField() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      ALTER TABLE decisions
      ADD COLUMN IF NOT EXISTS confidence_level SMALLINT
      CHECK (confidence_level >= 1 AND confidence_level <= 5);
    `);

    console.log('Successfully added confidence_level field to decisions table');
  } catch (error) {
    console.error('Error adding confidence_level field:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addConfidenceLevelField();
