const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testFilter() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Sign in
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'test_f279_filtered_export@example.com',
    password: 'Test1234!',
  });

  const token = signInData.session.access_token;

  // Test WITHOUT filter
  const responseAll = await fetch('http://localhost:4017/api/v1/decisions?limit=1000', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dataAll = await responseAll.json();
  console.log('\n=== WITHOUT FILTER ===');
  console.log('Total decisions:', dataAll.data?.length || 0);
  dataAll.data?.forEach(d => console.log(`- ${d.title} | category_id: ${d.category_id || 'none'}`));

  // Test WITH Career filter
  const categoryId = 'f0427913-ec86-4ec4-b135-3c4d2b91c2d3';
  const responseFiltered = await fetch(`http://localhost:4017/api/v1/decisions?limit=1000&category=${categoryId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dataFiltered = await responseFiltered.json();
  console.log('\n=== WITH CAREER FILTER ===');
  console.log('Total decisions:', dataFiltered.data?.length || 0);
  dataFiltered.data?.forEach(d => console.log(`- ${d.title} | category_id: ${d.category_id || 'none'}`));

  console.log('\n=== VERIFICATION ===');
  console.log('All decisions count:', dataAll.data?.length);
  console.log('Filtered decisions count:', dataFiltered.data?.length);
  console.log('Filter working?', dataFiltered.data?.length < dataAll.data?.length ? 'YES ✅' : 'NO ❌');
}

testFilter().catch(console.error);
