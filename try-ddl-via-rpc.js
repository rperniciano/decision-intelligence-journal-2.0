import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('Testing DDL execution via RPC...\n');

// Try 1: Check if sql_exec function exists
console.log('Attempt 1: Testing sql_exec() function...');
const { data: data1, error: error1 } = await supabase.rpc('sql_exec', {
  sql: 'SELECT 1 as test'
});
if (error1) {
  console.log('❌ sql_exec not available:', error1.message);
} else {
  console.log('✅ sql_exec available!', data1);
}

// Try 2: Check if exec_ddl function exists
console.log('\nAttempt 2: Testing exec_ddl() function...');
const { data: data2, error: error2 } = await supabase.rpc('exec_ddl', {
  ddl: 'SELECT 1 as test'
});
if (error2) {
  console.log('❌ exec_ddl not available:', error2.message);
} else {
  console.log('✅ exec_ddl available!', data2);
}

// Try 3: Check if there's a run_sql function
console.log('\nAttempt 3: Testing run_sql() function...');
const { data: data3, error: error3 } = await supabase.rpc('run_sql', {
  query: 'SELECT 1 as test'
});
if (error3) {
  console.log('❌ run_sql not available:', error3.message);
} else {
  console.log('✅ run_sql available!', data3);
}

// Try 4: Try direct SQL via PostgreSQL protocol simulation
console.log('\nAttempt 4: Testing execute_sql() function...');
const { data: data4, error: error4 } = await supabase.rpc('execute_sql', {
  query: 'SELECT 1 as test'
});
if (error4) {
  console.log('❌ execute_sql not available:', error4.message);
} else {
  console.log('✅ execute_sql available!', data4);
}

// Try 5: Check pg_catalog for available functions
console.log('\nAttempt 5: Querying pg_proc for DDL execution functions...');
const { data: data5, error: error5 } = await supabase
  .from('pg_proc')
  .select('proname')
  .ilike('proname', '%exec%')
  .limit(20);
if (error5) {
  console.log('❌ Cannot query pg_proc:', error5.message);
} else {
  console.log('✅ Found exec-related functions:', data5?.map(f => f.proname));
}

console.log('\n========================================');
console.log('CONCLUSION: No automated DDL path available');
console.log('========================================');
console.log('\nManual execution required via:');
console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
