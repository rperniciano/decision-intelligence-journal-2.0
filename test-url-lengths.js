// Test various URL lengths to find the breaking point
const testCases = [500, 1000, 1500, 2000, 2500];

testCases.forEach(length => {
  const url = `http://localhost:5173/?test=${'x'.repeat(length)}`;
  console.log(`URL length ${length}: total ${url.length} chars`);
  console.log(url);
  console.log('---');
});
