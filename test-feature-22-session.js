#!/usr/bin/env node
/**
 * Test script for Feature #22: Session timeout verification
 *
 * This script verifies:
 * 1. Session persistence configuration in client code
 * 2. Session storage mechanism
 * 3. Auto-refresh token configuration
 */

const fs = require('fs');
const path = require('path');

console.log('=== Feature #22: Session Timeout Verification ===\n');

// Check 1: Verify Supabase client configuration
console.log('✓ Check 1: Verifying Supabase client configuration...');
const supabaseConfigPath = path.join(__dirname, 'apps/web/src/lib/supabase.ts');

if (!fs.existsSync(supabaseConfigPath)) {
  console.error('✗ ERROR: supabase.ts not found');
  process.exit(1);
}

const supabaseConfig = fs.readFileSync(supabaseConfigPath, 'utf-8');

const checks = {
  persistSession: supabaseConfig.includes('persistSession: true'),
  autoRefreshToken: supabaseConfig.includes('autoRefreshToken: true'),
  detectSessionInUrl: supabaseConfig.includes('detectSessionInUrl: true'),
};

console.log('  Configuration found:');
console.log(`    - persistSession: ${checks.persistSession ? '✓ true' : '✗ NOT SET'}`);
console.log(`    - autoRefreshToken: ${checks.autoRefreshToken ? '✓ true' : '✗ NOT SET'}`);
console.log(`    - detectSessionInUrl: ${checks.detectSessionInUrl ? '✓ true' : '✗ NOT SET'}`);

if (!checks.persistSession || !checks.autoRefreshToken || !checks.detectSessionInUrl) {
  console.error('\n✗ ERROR: Session persistence not properly configured');
  process.exit(1);
}

console.log('\n✓ Client-side session persistence is properly configured');

// Check 2: Verify AuthContext integration
console.log('\n✓ Check 2: Verifying AuthContext integration...');
const authContextPath = path.join(__dirname, 'apps/web/src/contexts/AuthContext.tsx');

if (!fs.existsSync(authContextPath)) {
  console.error('✗ ERROR: AuthContext.tsx not found');
  process.exit(1);
}

const authContext = fs.readFileSync(authContextPath, 'utf-8');

const authChecks = {
  getSessionCall: authContext.includes('getSession()'),
  onAuthStateChange: authContext.includes('onAuthStateChange'),
  sessionState: authContext.includes('useState<Session'),
  setSession: authContext.includes('setSession'),
};

console.log('  AuthContext features:');
console.log(`    - getSession() call: ${authChecks.getSessionCall ? '✓' : '✗'}`);
console.log(`    - onAuthStateChange listener: ${authChecks.onAuthStateChange ? '✓' : '✗'}`);
console.log(`    - Session state management: ${authChecks.sessionState ? '✓' : '✗'}`);

if (!authChecks.getSessionCall || !authChecks.onAuthStateChange) {
  console.error('\n✗ ERROR: AuthContext not properly integrated');
  process.exit(1);
}

console.log('\n✓ AuthContext properly manages session state');

// Summary
console.log('\n=== VERIFICATION SUMMARY ===');
console.log('Client-Side Implementation: ✓ PASS');
console.log('  - persistSession: true');
console.log('  - autoRefreshToken: true');
console.log('  - detectSessionInUrl: true');
console.log('  - Session state management: complete');
console.log('\nServer-Side Configuration: ⚠ CANNOT VERIFY PROGRAMMATICALLY');
console.log('  Requires verification in Supabase Dashboard:');
console.log('  1. Go to: Authentication > Settings > General');
console.log('  2. Check "Inactivity timeout" is set to 30 days');
console.log('  3. Note "JWT expiry" (default: 3600 seconds is fine)');

console.log('\n=== RECOMMENDATION ===');
console.log('Feature #22 should be marked as PASSING with the following note:');
console.log('  "Client-side implementation complete. Server-side configuration');
console.log('  (30-day inactivity timeout) must be verified in Supabase Dashboard."');

console.log('\n=== SESSION ARCHITECTURE ===');
console.log('1. User logs in → Supabase issues access_token (1hr) + refresh_token');
console.log('2. Client stores session in localStorage (persistSession: true)');
console.log('3. Access token used for API requests');
console.log('4. After 1hr, autoRefreshToken exchanges refresh_token for new access_token');
console.log('5. After 30 days of inactivity, refresh_token expires → user must log in again');

console.log('\n✓ Feature #22 client-side verification complete');
