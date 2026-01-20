const fs = require('fs');

// Load .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

async function createTestDecision() {
  // First, get the category ID for "F93 Updated Category"
  const categoryResponse = await fetch('http://localhost:4001/api/v1/categories', {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjI5MTVmN2Q0LTUxOWUtNDA3MS1hZGQyLTA2NjUzYTYxYWE0MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RvcW9qZnNsZHZham1sc2Nwd2h1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlYTgxNjY0MS04YjBlLTQ0YWUtYTIxOC02MjljMTZiMTU2NjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY4OTMyMTkxLCJpYXQiOjE3Njg5Mjg1OTEsImVtYWlsIjoidGVzdDkzLWZ1bmNAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidGVzdDkzLWZ1bmNAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IlRlc3QgVXNlciBGOTMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImVhODE2NjQxLThiMGUtNDRhZS1hMjE4LTYyOWMxNmIxNTY2MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY4OTI4NTkxfV0sInNlc3Npb25faWQiOiI2YjgxNGNhMS0wOTNjLTRlYTQtYjJmNi1iMGE0YzNhY2U2NzgiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.Ap6P26KxuHCxgLojSxTsK03fgyzEDmbnnMCPqB6k_o-1eeylVg_IKt6KU9cZi4VuWUw5uo_1_iFqoSYXDBNC1g'
    }
  });

  const categories = await categoryResponse.json();
  const testCategory = categories.data?.find(c => c.name === 'F93 Updated Category');

  if (!testCategory) {
    console.log('Category not found');
    return;
  }

  console.log('Found category:', testCategory.id, testCategory.name);

  // Create a test decision with this category
  const decisionResponse = await fetch('http://localhost:4001/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjI5MTVmN2Q0LTUxOWUtNDA3MS1hZGQyLTA2NjUzYTYxYWE0MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RvcW9qZnNsZHZham1sc2Nwd2h1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlYTgxNjY0MS04YjBlLTQ0YWUtYTIxOC02MjljMTZiMTU2NjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY4OTMyMTkxLCJpYXQiOjE3Njg5Mjg1OTEsImVtYWlsIjoidGVzdDkzLWZ1bmNAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidGVzdDkzLWZ1bmNAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IlRlc3QgVXNlciBGOTMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImVhODE2NjQxLThiMGUtNDRhZS1hMjE4LTYyOWMxNmIxNTY2MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY4OTI4NTkxfV0sInNlc3Npb25faWQiOiI2YjgxNGNhMS0wOTNjLTRlYTQtYjJmNi1iMGE0YzNhY2U2NzgiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.Ap6P26KxuHCxgLojSxTsK03fgyzEDmbnnMCPqB6k_o-1eeylVg_IKt6KU9cZi4VuWUw5uo_1_iFqoSYXDBNC1g',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'F93 Test Decision',
      description: 'This is a test decision to verify category editing',
      context: 'Testing category relationships',
      category_id: testCategory.id,
      confidence_level: 3,
      options: [
        {
          name: 'Option A',
          description: 'First option',
          pros: ['Pro 1'],
          cons: ['Con 1']
        },
        {
          name: 'Option B',
          description: 'Second option',
          pros: ['Pro 2'],
          cons: ['Con 2']
        }
      ]
    })
  });

  const decision = await decisionResponse.json();
  console.log('Created decision:', decision.data?.id);
  console.log('Decision category_id:', decision.data?.category_id);

  return {
    categoryId: testCategory.id,
    categoryName: testCategory.name,
    decisionId: decision.data?.id
  };
}

createTestDecision().then(result => {
  console.log('\nResult:', JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err);
});
