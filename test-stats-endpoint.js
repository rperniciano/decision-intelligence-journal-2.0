const token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI5MTVmN2Q0LTUxOWUtNDA3MS1hZGQyLTA2NjUzYTYxYWE0MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RvcW9qZnNsZHZham1sc2Nwd2h1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5NGJkNjdjYi1iMDk0LTQzODctYTljOC0yNmIwYzY1OTA0Y2QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY4NjE0ODgyLCJpYXQiOjE3Njg2MTEyODIsImVtYWlsIjoibW9iaWxldGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb2JpbGV0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJNb2JpbGUgVGVzdCBVc2VyIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI5NGJkNjdjYi1iMDk0LTQzODctYTljOC0yNmIwYzY1OTA0Y2QifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2ODYxMTI4Mn1dLCJzZXNzaW9uX2lkIjoiZDgxZjQ4YTgtNzFkZC00NjAxLThiNGMtNzM3MzBmNWY2ODU0IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.zL9Oo_hCSB3_McwnjYTYUzv4bLPqTljFBopXxusAYKLULe5mc-I4Z0bjq0TlCyXpQstayZ_6WeIc0k5LkBmOqg';

fetch('http://localhost:3001/api/v1/decisions/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(async r => {
  console.log('Status:', r.status);
  const text = await r.text();
  console.log('Response:', text);
  try {
    const json = JSON.parse(text);
    console.log('JSON:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('Not JSON');
  }
})
.catch(e => console.error('Error:', e));
