// Get token from localStorage after login
const token = await page.evaluate(() => localStorage.getItem('sb-token'));

console.log('Token:', token ? token.substring(0, 30) + '...' : 'No token found');

const timestamp = Date.now();

const response = await fetch('http://localhost:4001/api/v1/decisions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: `Test Abandonment Decision ${timestamp}`,
    transcript: 'This is a test decision for abandonment workflow',
    status: 'deliberating',
    recordedAt: new Date().toISOString()
  })
});

const data = await response.json();
console.log('Decision created:', JSON.stringify(data, null, 2));
console.log('Decision ID:', data.id);
