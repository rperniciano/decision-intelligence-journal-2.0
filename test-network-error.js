// Script to temporarily stop API server for testing
const { exec } = require('child_process');

// Find and kill the API server process
exec('ps aux | grep "apps/api" | grep -v grep', (error, stdout, stderr) => {
  if (error) {
    console.error('Error finding process:', error);
    return;
  }

  const lines = stdout.trim().split('\n');
  console.log('Found processes:', lines);

  // Extract PIDs and kill them
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[1];
    if (pid && !isNaN(pid)) {
      console.log(`Killing PID ${pid}...`);
      exec(`kill -9 ${pid}`, (err) => {
        if (err) console.error(`Failed to kill ${pid}:`, err);
        else console.log(`Killed ${pid}`);
      });
    }
  });

  setTimeout(() => {
    console.log('\nAPI server should be stopped now.');
    console.log('Test the network error in the browser, then restart with ./init.sh');
  }, 1000);
});
