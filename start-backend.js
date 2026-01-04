/**
 * Offline PDF Reader with Local LLM - Backend Starter Script
 * Copyright (c) 2024-2026 Tereza Gorgolova
 * All rights reserved.
 *
 * This file is part of Offline PDF Reader created by Tereza Gorgolova
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const isWindows = process.platform === 'win32';
const PORT = 8000;

const backendDir = path.join(__dirname, 'python-backend');
const venvDir = path.join(backendDir, 'venv');

const pythonExe = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

const mainScript = path.join(backendDir, 'main.py');

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

function killExistingBackend() {
  return new Promise((resolve) => {
    console.log('\x1b[33m%s\x1b[0m', '🔍 Checking for existing backend processes...');

    let killCommand;

    if (isWindows) {
      killCommand = `powershell -Command "Get-Process | Where-Object {$_.Path -like '*python-backend\\venv\\*' -or ($_.ProcessName -eq 'python' -and $_.CommandLine -like '*main.py*')} | Stop-Process -Force"`;
    } else {
      killCommand = `pkill -f "python.*main\\.py" || true`;
    }

    exec(killCommand, (error, stdout, stderr) => {
      if (error && !isWindows) {
        console.log('   No existing backend processes found');
      } else if (!error || isWindows) {
        console.log('\x1b[32m%s\x1b[0m', '   ✓ Cleaned up existing processes');
      }

      setTimeout(resolve, 500);
    });
  });
}

async function waitForPortRelease(port, maxWaitMs = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const inUse = await checkPortInUse(port);
    if (!inUse) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return false;
}

async function main() {
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

  if (!fs.existsSync(mainScript)) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Backend script not found!');
    console.error(`Expected: ${mainScript}`);
    process.exit(1);
  }

  const portInUse = await checkPortInUse(PORT);

  if (portInUse) {
    console.log('\x1b[33m%s\x1b[0m', `⚠️  Port ${PORT} is already in use`);
    await killExistingBackend();

    const released = await waitForPortRelease(PORT);

    if (!released) {
      console.error('\x1b[31m%s\x1b[0m', `\n❌ Port ${PORT} is still in use after cleanup`);
      console.error('\x1b[33m%s\x1b[0m', '\nManual cleanup required:');
      if (isWindows) {
        console.error(`  netstat -ano | findstr :${PORT}`);
        console.error('  taskkill /PID <PID> /F');
      } else {
        console.error(`  lsof -i :${PORT}`);
        console.error('  kill -9 <PID>');
      }
      console.error('');
      process.exit(1);
    }

    console.log('\x1b[32m%s\x1b[0m', `   ✓ Port ${PORT} is now available\n`);
  }

  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting Python backend...');
  console.log(`   Platform: ${isWindows ? 'Windows' : 'Linux/Mac'}`);
  console.log(`   Python: ${pythonExe}`);
  console.log(`   Script: ${mainScript}`);
  console.log(`   Port: ${PORT}\n`);

  const backend = spawn(pythonExe, [mainScript], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: false
  });

  backend.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error('\x1b[31m%s\x1b[0m', `\n❌ Python backend exited with code ${code}`);
      console.error('\x1b[33m%s\x1b[0m', '\nCommon issues:');
      console.error('  1. Missing dependencies: cd python-backend && pip install -r requirements.txt');
      console.error('  2. Port conflict: Port cleanup failed (see manual cleanup above)');
      console.error('  3. Missing model file: Download a GGUF model to the models/ directory\n');
    }
    process.exit(code || 0);
  });

  backend.on('error', (err) => {
    console.error('\x1b[31m%s\x1b[0m', '❌ Failed to start Python backend:');
    console.error(err);
    process.exit(1);
  });

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
}

main().catch((err) => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Fatal error:');
  console.error(err);
  process.exit(1);
});
