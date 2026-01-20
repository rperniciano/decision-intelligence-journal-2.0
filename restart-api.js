import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Kill existing API process
if (existsSync('api.pid')) {
  const pid = parseInt(readFileSync('api.pid', 'utf-8'));
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Killed old API process (PID ${pid})`);
  } catch (e) {
    console.log('No existing API process to kill');
  }
}

// Start new API process
setTimeout(() => {
  const api = spawn('node', ['apps/api/dist/server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  // Save PID
  writeFileSync('api.pid', api.pid.toString());
  console.log(`Started new API process (PID ${api.pid})`);

  // Detach
  api.unref();
}, 2000);
