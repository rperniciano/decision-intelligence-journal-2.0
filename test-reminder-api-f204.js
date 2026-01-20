// Feature #204: Test reminder background job via API
const fs = require('fs');
const https = require('https');
const http = require('http');

const API_URL = 'http://localhost:4001';
const API_PORT = 4001;

function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testReminderJob() {
  try {
    console.log('1. Logging in...');
    const loginRes = await makeRequest('/api/v1/login', 'POST', {
      email: 'test204@example.com',
      password: 'Test204123!'
    });

    if (!loginRes.data.session || !loginRes.data.session.access_token) {
      console.log('Login failed:', loginRes.data);
      return;
    }

    const token = loginRes.data.session.access_token;
    console.log('✓ Logged in');

    // Create a decision that was decided in the past with a follow_up_date in the past
    const pastDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
    const yesterday = new Date(Date.now() - 86400000).toISOString(); // 1 day ago

    console.log('\\n2. Creating a past decision with due reminder...');
    const createRes = await makeRequest('/api/v1/decisions', 'POST', {
      title: 'Test Decision F204 - Background Job Test',
      status: 'decided',
      decided_at: yesterday,
      follow_up_date: pastDate, // Due 1 minute ago
      remind_at: pastDate // Also create a reminder
    }, token);

    if (createRes.status !== 200 && createRes.status !== 201) {
      console.log('Create decision failed:', createRes.data);
      return;
    }

    const decision = createRes.data.decision || createRes.data;
    console.log('✓ Decision created:', decision.id);
    console.log('  Follow-up date:', decision.follow_up_date);

    console.log('\\n3. Waiting 70 seconds for background job to process...');
    console.log('   (Job runs every 60 seconds)');
    await new Promise(resolve => setTimeout(resolve, 70000));

    console.log('\\n4. Checking reminder job stats...');
    const statsRes = await makeRequest('/reminder-job/stats', 'GET');

    console.log('Job stats:', statsRes.data);

    console.log('\\n5. Checking reminder status...');
    const reminderRes = await makeRequest(`/api/v1/decisions/${decision.id}/reminders`, 'GET', null, token);

    console.log('Reminders:', reminderRes.data);

    // Check if reminder was marked as sent
    if (reminderRes.data.reminders && reminderRes.data.reminders.length > 0) {
      const reminder = reminderRes.data.reminders[0];
      if (reminder.status === 'sent') {
        console.log('\\n✅ SUCCESS! Background job processed the reminder and marked it as sent');
      } else {
        console.log('\\n❌ Reminder status:', reminder.status, '(expected: sent)');
      }
    } else {
      console.log('\\n❌ No reminders found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReminderJob();
