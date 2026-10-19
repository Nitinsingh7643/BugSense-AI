import { spawn } from 'child_process';
import process from 'process';

console.log('🚀 [BugSense AI] Starting Full-Stack Development Environment...\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Spawn server process
const serverProc = spawn(npmCmd, ['--prefix', 'server', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Spawn client process
const clientProc = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n🛑 [BugSense AI] Gracefully shutting down server and client processes...');
  try { serverProc.kill(); } catch (e) {}
  try { clientProc.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

serverProc.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`[Server] Exited with code ${code}`);
  }
});

clientProc.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`[Client] Exited with code ${code}`);
  }
});
