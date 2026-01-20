// Debug the filter logic
const now = new Date();
const romeTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Rome', hour12: false });
console.log('Current time (Rome):', romeTimeStr);

const romeTime = new Date(romeTimeStr);
console.log('Rome time as Date:', romeTime.toISOString());
console.log('Rome hour:', romeTime.getHours());

// Decision due at 18:30 today
const hiddenDecisionTime = new Date(romeTime);
hiddenDecisionTime.setHours(18, 30, 0, 0);
console.log('\nHidden decision due at:', hiddenDecisionTime.toISOString());

// Quiet start today at 18:00
const quietStart = '18:00';
const userTimezone = 'Europe/Rome';

function getTodayTimeAt(timeStr, timezone) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const nowLocal = new Date();
  const result = new Date(nowLocal.toLocaleString('en-US', { timeZone: timezone }));
  result.setHours(hours, minutes, 0, 0);
  return result;
}

const todayQuietStart = getTodayTimeAt(quietStart, userTimezone);
console.log('Quiet start today:', todayQuietStart.toISOString());
console.log('Hidden decision < Quiet start?', hiddenDecisionTime < todayQuietStart);

// The issue: getTodayTimeAt creates a date at 18:00, but hiddenDecisionTime is also at 18:00
// We need to check if hiddenDecisionTime is BEFORE or AFTER quiet start

// Let's check the timestamps
console.log('\nTimestamps:');
console.log('Hidden decision time:', hiddenDecisionTime.getTime());
console.log('Quiet start time:', todayQuietStart.getTime());

// The problem is both are being set to 18:00 on the same day!
// I need to create the decision at 18:30, not just set the hour
