const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCSVExport() {
  const email = 'test_f277@example.com';

  // Get user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found');
    return;
  }

  // Count decisions in database
  const { count, data: decisions } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: false })
    .eq('user_id', user.id);

  console.log('=== Feature #277: CSV Export Completeness Verification ===\n');

  console.log('Database Count:');
  console.log(`  Total decisions: ${count}`);

  // Read CSV file
  const csvPath = './.playwright-mcp/decisions-export-2026-01-20.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  console.log('\nCSV File Count:');
  console.log(`  Total lines: ${lines.length}`);
  console.log(`  Header row: 1`);
  console.log(`  Data rows: ${lines.length - 1}`);

  console.log('\nVerification:');
  if (count === lines.length - 1) {
    console.log('  ✅ COUNTS MATCH: Database count equals CSV data rows');
    console.log(`  ✅ All ${count} decisions successfully exported to CSV`);
  } else {
    console.log('  ❌ COUNTS MISMATCH');
    console.log(`     Database: ${count} decisions`);
    console.log(`     CSV: ${lines.length - 1} data rows`);
    console.log(`     Difference: ${Math.abs(count - (lines.length - 1))} decisions`);
  }

  console.log('\nDecision Titles in Database:');
  decisions.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.title} (${d.status})`);
  });

  console.log('\nDecision Titles in CSV:');
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    const title = columns[0].replace(/"/g, '');
    const status = columns[1].replace(/"/g, '');
    console.log(`  ${i}. ${title} (${status})`);
  }

  console.log('\n=== Verification Complete ===');
}

verifyCSVExport().catch(console.error);
