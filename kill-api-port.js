const { execSync } = require('child_process');

try {
  const output = execSync('netstat -ano | findstr :4001', { encoding: 'utf8' });
  const lines = output.trim().split('\n');

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== 'PID') {
      console.log(`Killing PID: ${pid}`);
      try {
        execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' });
        console.log(`✓ Killed process ${pid}`);
      } catch (e) {
        console.log(`✗ Failed to kill ${pid}: ${e.message}`);
      }
    }
  });
} catch (e) {
  console.log('No process found on port 4001');
}
