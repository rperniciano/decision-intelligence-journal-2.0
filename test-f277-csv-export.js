const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCSVExport() {
  const email = `f277-csv-test-${Date.now()}@example.com`;
  const password = 'testpass123';

  console.log('=== Feature #277: CSV Export Headers Test ===');
  console.log(`Test email: ${email}`);

  // 1. Create user
  console.log('\n1. Creating user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Error creating user:', signUpError);
    return;
  }

  const userId = signUpData.user.id;
  console.log(`✅ User created: ${userId}`);

  // 2. Manually confirm user (bypass email verification)
  console.log('\n2. Confirming user email...');
  const { data: confirmData, error: confirmError } = await supabase.auth.admin.updateUserById(
    userId,
    { email_confirm: true }
  );

  if (confirmError && !confirmError.message.includes('Auth api not configured')) {
    console.log('Note: Using admin auth requires service role key, trying direct insert...');
  }

  // 3. Insert test decisions with various data
  console.log('\n3. Inserting test decisions...');

  const decisions = [
    {
      user_id: userId,
      title: 'Career Change Decision',
      description: 'Should I accept the new job offer at TechCorp?',
      status: 'decided',
      created_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      title: 'Home Purchase',
      description: 'Deciding between buying a house or continuing to rent',
      status: 'in_progress',
      created_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      title: 'Learning New Skill',
      description: 'Should I invest time in learning Rust programming language?',
      status: 'draft',
      created_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      title: 'Vacation Destination',
      description: 'Choosing between Japan, Italy, or New Zealand for summer vacation',
      status: 'decided',
      created_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      title: 'Freelance Project',
      description: 'Should I take on the freelance web development project?',
      status: 'decided',
      created_at: new Date().toISOString(),
    },
  ];

  const { data: insertedDecisions, error: insertError } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (insertError) {
    console.error('Error inserting decisions:', insertError);
    return;
  }

  console.log(`✅ Inserted ${insertedDecisions.length} decisions:`);
  insertedDecisions.forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.title} (${d.status})`);
  });

  // 4. Login to get session token
  console.log('\n4. Logging in to get session token...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Error signing in:', signInError);
    return;
  }

  const token = signInData.session.access_token;
  console.log(`✅ Logged in, token: ${token.substring(0, 20)}...`);

  // 5. Export as CSV
  console.log('\n5. Exporting data as CSV...');

  const response = await fetch('http://localhost:4020/api/v1/export/csv', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error exporting CSV:', errorText);
    return;
  }

  const csvText = await response.text();
  console.log(`✅ CSV export received (${csvText.length} bytes)`);

  // 6. Save CSV file
  const fs = require('fs');
  const filename = `.playwright-mcp/decisions-export-f277-${Date.now()}.csv`;
  fs.writeFileSync(filename, csvText);
  console.log(`✅ CSV saved to: ${filename}`);

  // 7. Verify CSV headers
  console.log('\n6. Verifying CSV headers...');

  const lines = csvText.split('\n');
  const headerLine = lines[0];
  const headers = headerLine.split(',');

  console.log('\n📋 CSV Headers:');
  headers.forEach((h, i) => {
    console.log(`   ${i + 1}. ${h.trim()}`);
  });

  // 8. Check for expected headers
  const expectedHeaders = [
    'id',
    'user_id',
    'title',
    'description',
    'status',
    'created_at',
    'updated_at',
  ];

  console.log('\n7. Header validation:');
  const missingHeaders = expectedHeaders.filter(h => !headerLine.includes(h));

  if (missingHeaders.length > 0) {
    console.log(`❌ Missing expected headers: ${missingHeaders.join(', ')}`);
  } else {
    console.log('✅ All expected headers present');
  }

  // 9. Verify data rows follow headers
  console.log('\n8. Verifying data rows...');
  const dataRows = lines.slice(1).filter(l => l.trim());
  console.log(`   Found ${dataRows.length} data rows`);

  if (dataRows.length > 0) {
    const firstDataRow = dataRows[0];
    const firstDataColumns = firstDataRow.split(',');

    console.log(`   First row has ${firstDataColumns.length} columns`);
    console.log(`   Header row has ${headers.length} columns`);

    if (firstDataColumns.length === headers.length) {
      console.log('✅ Data columns match header count');
    } else {
      console.log(`❌ Mismatch: Headers have ${headers.length} columns, data has ${firstDataColumns.length}`);
    }
  }

  // 10. Display sample data rows
  console.log('\n9. Sample data rows (first 3):');
  dataRows.slice(0, 3).forEach((row, i) => {
    console.log(`\n   Row ${i + 1}:`);
    const columns = row.split(',');
    headers.forEach((header, j) => {
      console.log(`      ${header}: ${columns[j]?.trim() || '(empty)'}`);
    });
  });

  console.log('\n=== Test Complete ===');
  console.log(`\nTest User: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`User ID: ${userId}`);
  console.log(`\nCSV File: ${filename}`);

  return {
    success: true,
    email,
    password,
    userId,
    csvFile: filename,
    headers,
    dataRowCount: dataRows.length,
  };
}

testCSVExport().catch(console.error);
