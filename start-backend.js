const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine platform
const isWindows = process.platform === 'win32';

// Paths
const backendDir = path.join(__dirname, 'python-backend');
const venvDir = path.join(backendDir, 'venv');

// Virtual environment Python executable
const pythonExe = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

// Main script
const mainScript = path.join(backendDir, 'main.py');

// Check if venv exists
if (!fs.existsSync(pythonExe)) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Python virtual environment not found!');
  console.error('\x1b[33m%s\x1b[0m', '\nPlease set up the backend first:');
  console.error('  cd python-backend');
  console.error('  python -m venv venv');
  if (isWindows) {
    console.error('  venv\\Scripts\\activate');
  } else {
    console.error('  source venv/bin/activate');
  }
  console.error('  pip install -r requirements.txt');
  console.error('\nThen try again: npm run electron:dev\n');
  process.exit(1);
}

// Check if main.py exists
if (!fs.existsSync(mainScript)) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Backend script not found!');
  console.error(`Expected: ${mainScript}`);
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting Python backend...');
console.log(`   Platform: ${isWindows ? 'Windows' : 'Linux/Mac'}`);
console.log(`   Python: ${pythonExe}`);
console.log(`   Script: ${mainScript}\n`);

// Start the Python backend
const backend = spawn(pythonExe, [mainScript], {
  cwd: backendDir,
  stdio: 'inherit', // Forward output to parent process
  shell: false
});

// Handle backend exit
backend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error('\x1b[31m%s\x1b[0m', `\n❌ Python backend exited with code ${code}`);
    console.error('\x1b[33m%s\x1b[0m', '\nCommon issues:');
    console.error('  1. Missing dependencies: cd python-backend && pip install -r requirements.txt');
    console.error('  2. Port already in use: Check if another process is using port 8000');
    console.error('  3. Missing model file: Download a GGUF model to the models/ directory\n');
  }
  process.exit(code || 0);
});

// Handle errors
backend.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Failed to start Python backend:');
  console.error(err);
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\x1b[33m%s\x1b[0m', '⏹️  Stopping Python backend...');
  backend.kill('SIGTERM');
  setTimeout(() => {
    backend.kill('SIGKILL');
    process.exit(0);
  }, 3000);
});

process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  setTimeout(() => {
    backend.kill('SIGKILL');
    process.exit(0);
  }, 3000);
});
