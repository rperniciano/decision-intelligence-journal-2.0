// Try to use Supabase Management API to execute migration
// This requires SUPABASE_ACCESS_TOKEN which we don't have

const SUPABASE_PROJECT_ID = 'doqojfsldvajmlscpwhu';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.log('❌ SUPABASE_ACCESS_TOKEN not found in environment\n');
  console.log('To get an access token:');
  console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
  console.log('2. Create a new access token');
  console.log('3. Add to .env: SUPABASE_ACCESS_TOKEN=<token>\n');
  console.log('Then run this script again.');
  process.exit(1);
}

async function executeMigrationViaManagementAPI() {
  const sql = `ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_note TEXT;`;

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql })
      }
    );

    if (response.ok) {
      console.log('✅ Migration executed successfully!');
      console.log('Feature #88 is now ready to test!');
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

executeMigrationViaManagementAPI();
