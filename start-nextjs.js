// start-nextjs.js
const { spawn } = require('child_process');
const path = require('path');

const nextStart = spawn('npx', ['next', 'start'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname) // Ensure we're in the correct directory
});

nextStart.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
});