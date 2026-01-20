async function testRateLimit() {
  const email = 'ratelimit-test-' + Date.now() + '@example.com';

  console.log('Testing rate limiting for email:', email);
  console.log('=====================================\n');

  // Attempt 6 logins with wrong password
  for (let i = 1; i <= 6; i++) {
    console.log(`Attempt ${i}:`);

    const response = await fetch('http://localhost:5173/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'WrongPassword' + i
      })
    });

    const data = await response.json();

    if (data.error) {
      console.log(`  Error: ${data.error}`);
      if (data.lockoutUntil) {
        console.log(`  Lockout until: ${data.lockoutUntil}`);
      }
    } else if (data.success) {
      console.log(`  Success: ${data.message}`);
    }

    console.log('');
  }
}

testRateLimit();
