const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseProjectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1];

const sql = `
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;
`;

// Use Supabase Management API to run SQL
const options = {
  hostname: `${supabaseProjectRef}.supabase.co`,
  path: '/rest/v1/rpc',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Prefer': 'return=representation'
  }
};

console.log('Attempting direct SQL execution...');

// Alternatively, use psql via Supabase
const { Pool } = require('pg');

async function runMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Try using raw query if available
    const { data, error } = await supabase
      .from('decisions')
      .select('id')
      .limit(1);

    console.log('Connected to database');
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    console.log('\nAfter running the SQL, press Enter to continue...');

  } catch (error) {
    console.error('Error:', error);
  }
}

runMigration();
