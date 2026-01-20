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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl ? 'found' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'found' : 'missing');
  process.exit(1);
}

async function checkDecisions() {
  const response = await fetch(`${supabaseUrl}/rest/v1/decisions?select=id,title&order=created_at.desc&limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`Current decisions in database: ${data.length > 0 ? 'Found records' : 'Empty'}`);
    if (data.length > 0) {
      console.log('Sample decision:', data[0]);
    }

    // Get total count
    const countResponse = await fetch(`${supabaseUrl}/rest/v1/decisions?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    const countHeader = countResponse.headers.get('content-range');
    console.log(`Total count header: ${countHeader}`);
  } else {
    console.error('Failed to check decisions:', response.status, await response.text());
  }
}

checkDecisions();
