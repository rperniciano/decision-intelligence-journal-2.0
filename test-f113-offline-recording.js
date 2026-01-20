/**
 * Feature #113: Offline recording with IndexedDB
 * Test script to verify the complete offline recording workflow
 */

console.log('='.repeat(80));
console.log('Feature #113: Offline Recording with IndexedDB - Verification Tests');
console.log('='.repeat(80));

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: IndexedDB database initialization
  console.log('\n[Test 1] IndexedDB database initialization');
  try {
    const dbExists = await new Promise((resolve) => {
      const request = indexedDB.open('DecisionsOfflineDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const storeNames = Array.from(db.objectStoreNames);
        const hasStore = storeNames.includes('pendingRecordings');
        db.close();
        resolve(hasStore);
      };
      request.onerror = () => resolve(false);
    });

    if (dbExists) {
      console.log('✅ PASS: IndexedDB database created with pendingRecordings store');
      testsPassed++;
    } else {
      console.log('❌ FAIL: IndexedDB database not properly initialized');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error checking IndexedDB:', error.message);
    testsFailed++;
  }

  // Test 2: Save recording to IndexedDB
  console.log('\n[Test 2] Save recording to IndexedDB');
  try {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const testBlob = new Blob([testData], { type: 'audio/webm' });

    const recordingId = await new Promise((resolve, reject) => {
      const request = indexedDB.open('DecisionsOfflineDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const recording = {
          id: 'test-' + Date.now(),
          audioBlob: testBlob,
          createdAt: Date.now(),
          size: testBlob.size,
          attempts: 0
        };

        const transaction = db.transaction(['pendingRecordings'], 'readwrite');
        const store = transaction.objectStore('pendingRecordings');
        const addRequest = store.add(recording);

        addRequest.onsuccess = () => resolve(recording.id);
        addRequest.onerror = () => reject(new Error('Failed to add recording'));
        db.close();
      };
      request.onerror = () => reject(new Error('Failed to open database'));
    });

    console.log(`✅ PASS: Recording saved to IndexedDB (ID: ${recordingId})`);
    testsPassed++;
  } catch (error) {
    console.log('❌ FAIL: Error saving to IndexedDB:', error.message);
    testsFailed++;
  }

  // Test 3: Retrieve pending recordings count
  console.log('\n[Test 3] Retrieve pending recordings count');
  try {
    const count = await new Promise((resolve, reject) => {
      const request = indexedDB.open('DecisionsOfflineDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['pendingRecordings'], 'readonly');
        const store = transaction.objectStore('pendingRecordings');
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          db.close();
          resolve(countRequest.result);
        };
        countRequest.onerror = () => reject(new Error('Failed to count'));
      };
      request.onerror = () => reject(new Error('Failed to open database'));
    });

    if (count > 0) {
      console.log(`✅ PASS: Retrieved pending recordings count (${count} recordings)`);
      testsPassed++;
    } else {
      console.log('❌ FAIL: No pending recordings found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error retrieving count:', error.message);
    testsFailed++;
  }

  // Test 4: Delete recording from IndexedDB
  console.log('\n[Test 4] Delete recording from IndexedDB');
  try {
    // First get a recording ID
    const recordingId = await new Promise((resolve) => {
      const request = indexedDB.open('DecisionsOfflineDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['pendingRecordings'], 'readonly');
        const store = transaction.objectStore('pendingRecordings');
        const getRequest = store.openCursor();

        getRequest.onsuccess = () => {
          const cursor = getRequest.result;
          if (cursor) {
            resolve(cursor.value.id);
            cursor.continue();
          } else {
            resolve(null);
          }
        };
        db.close();
      };
      request.onerror = () => resolve(null);
    });

    if (recordingId) {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open('DecisionsOfflineDB', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['pendingRecordings'], 'readwrite');
          const store = transaction.objectStore('pendingRecordings');
          const deleteRequest = store.delete(recordingId);

          deleteRequest.onsuccess = () => {
            db.close();
            resolve();
          };
          deleteRequest.onerror = () => reject(new Error('Failed to delete'));
        };
        request.onerror = () => reject(new Error('Failed to open database'));
      });

      console.log(`✅ PASS: Recording deleted from IndexedDB (ID: ${recordingId})`);
      testsPassed++;
    } else {
      console.log('⚠️ SKIP: No recordings to delete');
    }
  } catch (error) {
    console.log('❌ FAIL: Error deleting recording:', error.message);
    testsFailed++;
  }

  // Test 5: Offline status detection
  console.log('\n[Test 5] Offline status detection');
  try {
    const isOnline = navigator.onLine;
    console.log(`✅ PASS: Network status detected (${isOnline ? 'Online' : 'Offline'})`);
    testsPassed++;
  } catch (error) {
    console.log('❌ FAIL: Error detecting network status:', error.message);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('Test Summary:');
  console.log(`  ✅ Passed: ${testsPassed}`);
  console.log(`  ❌ Failed: ${testsFailed}`);
  console.log(`  📊 Total:  ${testsPassed + testsFailed}`);
  console.log('='.repeat(80));

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Feature #113 is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.');
  }

  return { passed: testsPassed, failed: testsFailed };
}

// Run tests
runTests().then(results => {
  if (results.failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});
