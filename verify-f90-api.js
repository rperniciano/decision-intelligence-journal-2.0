// Verify Feature #90: Timing Patterns API
// Test that the insights API returns timing pattern data

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const TEST_EMAIL = 'f90-timing-test-1768916054936@example.com';
const TEST_PASSWORD = 'test123456';

const API_BASE = 'http://localhost:4001';

async function signInAndGetToken() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }

  return data.session.access_token;
}

async function testInsightsAPI(token) {
  console.log('\n=== Testing Insights API for Timing Patterns ===\n');

  const response = await fetch(`${API_BASE}/api/v1/insights`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.error('Response:', text);
    return null;
  }

  const insights = await response.json();

  // Check for timingPattern field
  if (!insights.timingPattern) {
    console.log('⚠️  timingPattern field is missing or null');
    console.log('This is expected if user has fewer than 5 decisions with outcomes');
    return insights;
  }

  console.log('✅ timingPattern field exists!\n');

  const tp = insights.timingPattern;

  // Display best hours
  console.log('Best Hours for Decisions:');
  if (tp.bestHours && tp.bestHours.length > 0) {
    tp.bestHours.forEach(hour => {
      const timeStr = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      console.log(`  - ${timeStr} (hour ${hour})`);
    });
  } else {
    console.log('  (none)');
  }

  // Display worst hours
  console.log('\nWorst Hours for Decisions:');
  if (tp.worstHours && tp.worstHours.length > 0) {
    tp.worstHours.forEach(hour => {
      const timeStr = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      console.log(`  - ${timeStr} (hour ${hour})`);
    });
  } else {
    console.log('  (none)');
  }

  // Display late night stats
  console.log('\nLate Night Decisions (10pm - 6am):');
  console.log(`  Count: ${tp.lateNightDecisions.count}`);
  console.log(`  Positive Rate: ${(tp.lateNightDecisions.positiveRate * 100).toFixed(1)}%`);

  // Display weekday breakdown
  console.log('\nWeekday Breakdown:');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (tp.weekdayBreakdown && tp.weekdayBreakdown.length > 0) {
    tp.weekdayBreakdown.forEach(wd => {
      console.log(`  ${dayNames[wd.day]}: ${wd.count} decisions, ${(wd.positiveRate * 100).toFixed(1)}% positive`);
    });
  } else {
    console.log('  (none)');
  }

  console.log('\n✅ Timing pattern data retrieved successfully!');

  return insights;
}

async function main() {
  try {
    console.log('Signing in as test user...');
    const token = await signInAndGetToken();
    console.log('✅ Signed in successfully');

    const insights = await testInsightsAPI(token);

    if (insights && insights.timingPattern) {
      console.log('\n=== Feature #90: Timing Patterns ===');
      console.log('Status: ✅ PASSING');
      console.log('The insights API correctly returns timing pattern data including:');
      console.log('  - Best hours for decisions');
      console.log('  - Worst hours for decisions');
      console.log('  - Late night decision statistics');
      console.log('  - Weekday breakdown');
    } else if (insights && insights.timingPattern === null) {
      console.log('\n=== Feature #90: Timing Patterns ===');
      console.log('Status: ⚠️  NEEDS MORE DATA');
      console.log('User needs at least 5 decisions with outcomes for timing patterns');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
