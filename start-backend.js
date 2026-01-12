/**
 * Offline PDF Reader with Local LLM - Backend Starter Script
 * Copyright (c) 2024-2026 Tereza Gorgolova
 * All rights reserved.
 *
 * This file is part of Offline PDF Reader created by Tereza Gorgolova
 */

const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const HOST = '127.0.0.1';
const PORT = 8000;
const HEALTH_CHECK_URL = `http://${HOST}:${PORT}/health`;

const backendDir = path.join(__dirname, 'python-backend');
const venvDir = path.join(backendDir, 'venv');
const modelsDir = path.join(__dirname, 'models');

const pythonExe = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

const mainScript = path.join(backendDir, 'main.py');

let backendProcess = null;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  const prefix = {
    info: 'INFO',
    success: '  OK',
    warn: 'WARN',
    error: ' ERR'
  };
  console.log(`${colors[type]}[${prefix[type]}]${colors.reset} ${message}`);
}

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

    server.listen(port, HOST);
  });
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_CHECK_URL, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            healthy: res.statusCode === 200 && json.status === 'ok',
            data: json
          });
        } catch {
          resolve({ healthy: false, data: null });
        }
      });
    });

    req.on('error', () => {
      resolve({ healthy: false, data: null });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ healthy: false, data: null });
    });
  });
}

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    log(`Attempting to free port ${port}...`, 'warn');

    let killCommand;

    if (isWindows) {
      killCommand = `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`;
    } else {
      killCommand = `lsof -ti :${port} | xargs -r kill -9 2>/dev/null || true`;
    }

    exec(killCommand, { timeout: 5000 }, (error) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  });
}

async function waitForBackendReady(maxWaitMs = 30000) {
  const startTime = Date.now();
  const checkInterval = 500;

  while (Date.now() - startTime < maxWaitMs) {
    const { healthy } = await checkBackendHealth();
    if (healthy) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  return false;
}

async function waitForPortFree(port, maxWaitMs = 5000) {
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

function validateEnvironment() {
  const errors = [];

  if (!fs.existsSync(backendDir)) {
    errors.push(`Backend directory not found: ${backendDir}`);
  }

  if (!fs.existsSync(pythonExe)) {
    errors.push(`Python virtual environment not found: ${pythonExe}`);
    errors.push('');
    errors.push('Setup instructions:');
    errors.push('  cd python-backend');
    errors.push('  python -m venv venv');
    if (isWindows) {
      errors.push('  .\\venv\\Scripts\\activate');
    } else {
      errors.push('  source venv/bin/activate');
    }
    errors.push('  python -m pip install -r requirements.txt');
  }

  if (!fs.existsSync(mainScript)) {
    errors.push(`Backend script not found: ${mainScript}`);
  }

  return errors;
}

function startBackendProcess() {
  log('Starting Python backend process...');

  const args = [mainScript, '--models-path', modelsDir];

  backendProcess = spawn(pythonExe, args, {
    cwd: backendDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    detached: false
  });

  backendProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      if (!line.includes('HEAD') && !line.includes('OPTIONS')) {
        console.log(`[BACKEND] ${line}`);
      }
    });
  });

  backendProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      if (!line.includes('HEAD') && !line.includes('OPTIONS')) {
        console.error(`[BACKEND] ${line}`);
      }
    });
  });

  backendProcess.on('error', (err) => {
    log(`Failed to start backend: ${err.message}`, 'error');
  });

  backendProcess.on('exit', (code, signal) => {
    if (code === 0) {
      log('Backend process exited normally', 'info');
    } else if (code !== null) {
      log(`Backend exited with code ${code}`, 'warn');
    } else if (signal) {
      log(`Backend terminated by signal ${signal}`, 'warn');
    }
    backendProcess = null;
  });

  return backendProcess;
}

function setupCleanup() {
  const cleanup = () => {
    if (backendProcess) {
      log('Stopping backend process...', 'warn');

      if (isWindows) {
        try {
          execSync(`taskkill /PID ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
        } catch {
          backendProcess.kill('SIGKILL');
        }
      } else {
        backendProcess.kill('SIGTERM');
        setTimeout(() => {
          if (backendProcess) {
            backendProcess.kill('SIGKILL');
          }
        }, 2000);
      }
    }
  };

  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...', 'warn');
    cleanup();
    setTimeout(() => process.exit(0), 500);
  });

  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...', 'warn');
    cleanup();
    setTimeout(() => process.exit(0), 500);
  });

  process.on('exit', cleanup);
}

async function main() {
  console.log('');
  log('=== PDF Reader Backend Starter ===');
  log(`Platform: ${isWindows ? 'Windows' : isMac ? 'macOS' : 'Linux'}`);
  console.log('');

  const errors = validateEnvironment();
  if (errors.length > 0) {
    errors.forEach(e => log(e, 'error'));
    process.exit(1);
  }

  log('Environment validated', 'success');

  const { healthy, data } = await checkBackendHealth();

  if (healthy) {
    log('Backend is already running and healthy', 'success');
    if (data && data.model_loaded) {
      log(`Model loaded: ${data.model_name || 'yes'}`, 'success');
    } else {
      log('No model loaded (place .gguf file in models/)', 'warn');
    }
    log('Using existing backend instance');
    console.log('');

    process.stdin.resume();
    return;
  }

  const portInUse = await checkPortInUse(PORT);

  if (portInUse) {
    log(`Port ${PORT} is in use but backend not responding`, 'warn');

    await killProcessOnPort(PORT);

    const portFree = await waitForPortFree(PORT);
    if (!portFree) {
      log(`Could not free port ${PORT}`, 'error');
      log('Manual cleanup required:', 'error');
      if (isWindows) {
        log(`  netstat -ano | findstr :${PORT}`, 'info');
        log('  taskkill /PID <PID> /F', 'info');
      } else {
        log(`  lsof -i :${PORT}`, 'info');
        log('  kill -9 <PID>', 'info');
      }
      process.exit(1);
    }

    log(`Port ${PORT} is now available`, 'success');
  }

  setupCleanup();

  log(`Python: ${pythonExe}`);
  log(`Script: ${mainScript}`);
  log(`Models: ${modelsDir}`);
  log(`Port: ${PORT}`);
  console.log('');

  startBackendProcess();

  log('Waiting for backend to be ready...');

  const ready = await waitForBackendReady(30000);

  if (ready) {
    const { data } = await checkBackendHealth();
    log('Backend is ready!', 'success');
    if (data && data.model_loaded) {
      log(`Model: ${data.model_name || 'loaded'}`, 'success');
    } else {
      log('No model loaded - place .gguf file in models/', 'warn');
    }
    console.log('');
    log(`Backend running at http://${HOST}:${PORT}`);
    console.log('');
  } else {
    log('Backend failed to start within timeout', 'error');
    log('Check the logs above for errors', 'error');
    process.exit(1);
  }
}

main().catch((err) => {
  log(`Fatal error: ${err.message}`, 'error');
  console.error(err);
  process.exit(1);
});
