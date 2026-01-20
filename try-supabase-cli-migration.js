// Try to execute Feature #88 migration using Supabase CLI
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Attempting to execute Feature #88 migration via Supabase CLI...\n');

const migrationFile = path.join(__dirname, 'migration-add-abandonment-columns.sql');

if (!fs.existsSync(migrationFile)) {
  console.error('❌ Migration file not found:', migrationFile);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

console.log('📄 Migration file found');
console.log('📋 SQL to execute:');
console.log('---');
console.log(migrationSQL);
console.log('---\n');

// Try to get Supabase project reference
try {
  // Check if we have linked project
  console.log('🔍 Checking Supabase CLI configuration...\n');

  try {
    const links = execSync('npx supabase db remote-commit --dry-run 2>&1', { encoding: 'utf8' });
    console.log('Project link status:', links);
  } catch (err) {
    console.log('⚠️  No linked project found');
    console.log('Output:', err.stdout || err.stderr);
  }

  // Try using db push with the project URL
  console.log('\n🚀 Attempting to push migration...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL not found in .env');
    console.log('\n💡 To execute migration manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    console.log('2. Copy contents of: migration-add-abandonment-columns.sql');
    console.log('3. Paste and execute in SQL Editor');
    process.exit(1);
  }

  if (!dbPassword) {
    console.log('⚠️  SUPABASE_DB_PASSWORD not set in .env');
    console.log('\n💡 AUTOMATED MIGRATION OPTIONS:');
    console.log('\nOption 1: Add database password to .env');
    console.log('  Add this line to .env:');
    console.log('  SUPABASE_DB_PASSWORD=your_database_password');
    console.log('  Then run: npx supabase db push');

    console.log('\nOption 2: Manual execution (RECOMMENDED)');
    console.log('  1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    console.log('  2. Copy contents of: migration-add-abandonment-columns.sql');
    console.log('  3. Paste and execute in SQL Editor');
    console.log('  4. Click "Run" button');

    console.log('\n⚠️  Cannot execute migration automatically without database credentials');
    process.exit(1);
  }

  // If we have password, try db push
  console.log('✅ Database password found, attempting push...\n');

  try {
    const pushResult = execSync(`npx supabase db push --password ${dbPassword}`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log('\n✅ Migration executed successfully!');
    console.log(pushResult);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.log('\n💡 Fallback: Manual execution in Supabase Dashboard');
    console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    console.log('2. Copy migration SQL from: migration-add-abandonment-columns.sql');
    console.log('3. Paste and execute');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 MANUAL EXECUTION REQUIRED:');
  console.log('   URL: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
  console.log('   File: migration-add-abandonment-columns.sql');
  process.exit(1);
}
