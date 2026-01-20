const { execSync } = require('child_process');

const ports = [4001, 3000, 5173];

ports.forEach(port => {
  try {
    // Windows: find and kill process on port
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    const lines = output.trim().split('\n');
    if (lines.length > 0) {
      const pid = lines[0].trim().split(/\s+/).pop();
      if (pid && !isNaN(parseInt(pid))) {
        console.log(`Killing process ${pid} on port ${port}`);
        execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' });
      }
    }
  } catch (e) {
    console.log(`No process found on port ${port}`);
  }
});

console.log('Done cleaning up ports');
