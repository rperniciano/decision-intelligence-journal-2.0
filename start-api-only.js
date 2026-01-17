const { spawn } = require('child_process');
const path = require('path');

console.log('Starting API server on port 3001...');

const apiProcess = spawn('npx', ['tsx', 'watch', 'src/server.ts'], {
  cwd: path.join(__dirname, 'apps', 'api'),
  stdio: 'inherit',
  shell: true
});

apiProcess.on('error', (err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});

apiProcess.on('exit', (code) => {
  console.log(`API process exited with code ${code}`);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nStopping API server...');
  apiProcess.kill();
  process.exit(0);
});
