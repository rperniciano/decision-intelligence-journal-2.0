async function createUser() {
  const response = await fetch('http://localhost:4001/api/v1/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sessiontest91@example.com',
      password: 'test123456',
      name: 'Session Test 91'
    })
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

createUser().catch(console.error);
