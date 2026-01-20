const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getSchema() {
  const response = await fetch(`${supabaseUrl}/rest/v1/decisions?select=*&limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    if (data.length > 0) {
      console.log('Decisions table columns:');
      console.log(Object.keys(data[0]).join('\n'));
    } else {
      console.log('No decisions found, trying to get schema via information_schema...');
      // Try to get schema from PostgreSQL
    }
  } else {
    console.error('Failed:', response.status, await response.text());
  }
}

getSchema();
