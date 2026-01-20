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

const TEST_USER_EMAIL = 'f284-performance-test@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

async function createTestUserAndDecisions() {
  console.log('Creating test user for performance testing...');

  // Check if user exists
  const checkResponse = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${TEST_USER_EMAIL}&select=id,email`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  let userId;

  // Check if user exists in our users table
  if (checkResponse.ok) {
    const existingUsers = await checkResponse.json();
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log('Found existing user:', userId);
    }
  }

  // If user doesn't exist in users table, create via auth
  if (!userId) {
    console.log('Creating new user via Supabase Auth...');
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true
      })
    });

    if (authResponse.ok) {
      const userData = await authResponse.json();
      userId = userData.id;
      console.log('Created auth user:', userId);
    } else {
      const errorText = await authResponse.text();
      console.error('Failed to create auth user:', authResponse.status, errorText);

      // User might already exist in auth, try to get them
      console.log('Trying to get existing user from auth...');
      const getResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (getResponse.ok) {
        const usersData = await getResponse.json();
        const existingUser = usersData.users.find(u => u.email === TEST_USER_EMAIL);
        if (existingUser) {
          userId = existingUser.id;
          console.log('Found existing auth user:', userId);
        }
      }

      if (!userId) {
        process.exit(1);
      }
    }

    // Create user profile
    console.log('Creating user profile...');
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: userId,
        email: TEST_USER_EMAIL,
        display_name: 'Performance Test User'
      })
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Failed to create profile:', profileResponse.status, errorText);
      // Profile might already exist, continue
    }
  } else {
    // Delete existing decisions for this user
    console.log('Deleting existing decisions...');
    await fetch(`${supabaseUrl}/rest/v1/decisions?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Create exactly 100 decisions
  console.log('Creating 100 decisions...');
  const decisions = [];
  const now = new Date();

  for (let i = 0; i < 100; i++) {
    const createdAt = new Date(now - (i * 3600000)); // Spread over 100 hours
    decisions.push({
      user_id: userId,
      title: `Performance Test Decision ${i + 1}`,
      description: `This is decision ${i + 1} for performance testing. It contains some text to simulate real content.`,
      status: i % 5 === 0 ? 'decided' : i % 3 === 0 ? 'in_progress' : 'draft',
      follow_up_date: i % 3 === 0 ? createdAt.toISOString() : null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      tags: i % 2 === 0 ? ['career'] : ['personal']
    });
  }

  // Batch insert decisions
  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/decisions`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(decisions)
  });

  if (insertResponse.ok) {
    console.log('✅ Created 100 decisions successfully');

    // Verify count
    const countResponse = await fetch(`${supabaseUrl}/rest/v1/decisions?user_id=eq.${userId}&select=id`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    const countHeader = countResponse.headers.get('content-range');
    console.log(`Total decisions for user: ${countHeader}`);

    console.log('\n========================================');
    console.log('TEST USER CREDENTIALS:');
    console.log('========================================');
    console.log(`Email: ${TEST_USER_EMAIL}`);
    console.log(`Password: ${TEST_USER_PASSWORD}`);
    console.log('========================================\n');
  } else {
    console.error('Failed to create decisions:', await insertResponse.text());
    process.exit(1);
  }
}

createTestUserAndDecisions().catch(console.error);
