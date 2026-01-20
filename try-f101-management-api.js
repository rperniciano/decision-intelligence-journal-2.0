/**
 * Try to execute Feature #101 migration via Supabase Management API v1
 * This uses the /sql endpoint with the service role key
 */

const https = require('https');

function httpsRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function tryManagementAPI() {
  console.log('🔍 Attempting Feature #101 migration via Supabase Management API...\n');

  const supabaseUrl = process.env.SUPABASE_URL; // https://doqojfsldvajmlscpwhu.supabase.co
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectRef = supabaseUrl.split('//')[1].split('.')[0]; // doqojfsldvajmlscpwhu

  console.log(`Project ref: ${projectRef}`);

  // Try the Management API v1 SQL endpoint
  const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`;

  console.log(`\nTrying: ${managementApiUrl}`);

  const sql = `
    ALTER TABLE "DecisionsFollowUpReminders"
    ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ;

    ALTER TABLE "DecisionsFollowUpReminders"
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

    CREATE INDEX IF NOT EXISTS idx_reminders_remind_at
    ON "DecisionsFollowUpReminders"(remind_at)
    WHERE status = 'pending';

    CREATE INDEX IF NOT EXISTS idx_reminders_user_id
    ON "DecisionsFollowUpReminders"(user_id);
  `;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey
    }
  };

  try {
    const result = await httpsRequest(managementApiUrl, options, { query: sql });

    console.log('\nResponse status:', result.status);
    console.log('Response body:', JSON.stringify(result.body, null, 2));

    if (result.status === 200 || result.status === 201) {
      console.log('\n✅ SUCCESS! Migration executed via Management API');
      return true;
    } else {
      console.log('\n❌ Management API request failed');
      return false;
    }
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    return false;
  }
}

require('dotenv').config();
tryManagementAPI().then(success => {
  if (!success) {
    console.log('\n⚠️  Management API approach failed');
    console.log('This may be due to:');
    console.log('  - API endpoint not available for this project tier');
    console.log('  - Service role key not having Management API permissions');
    console.log('  - Management API requires separate access token\n');
  }
  process.exit(success ? 0 : 1);
});
