/**
 * Offline PDF Reader with Local LLM - Electron Main Process
 * Copyright (c) 2024-2026 Tereza Gorgolova
 * All rights reserved.
 *
 * This file is part of Offline PDF Reader created by Tereza Gorgolova
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
let pythonProcess = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isWindows = process.platform === 'win32';

const HOST = '127.0.0.1';
const PORT = 8000;
const BACKEND_URL = `http://${HOST}:${PORT}`;

function log(message) {
  console.log(`[Electron] ${message}`);
}

function getPythonExecutable() {
  if (isDev) {
    const venvPython = isWindows
      ? path.join(__dirname, '..', 'python-backend', 'venv', 'Scripts', 'python.exe')
      : path.join(__dirname, '..', 'python-backend', 'venv', 'bin', 'python');

    if (fs.existsSync(venvPython)) {
      return venvPython;
    }
    log('Warning: venv Python not found, falling back to system Python');
    return 'python';
  }

  return path.join(process.resourcesPath, 'python-backend', 'main.exe');
}

function getBackendScript() {
  if (isDev) {
    return path.join(__dirname, '..', 'python-backend', 'main.py');
  }
  return null;
}

function getModelsPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'models');
  }
  return path.join(process.resourcesPath, 'models');
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/health`, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(res.statusCode === 200 && json.status === 'ok');
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(maxWaitMs = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const healthy = await checkBackendHealth();
    if (healthy) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}

async function startPythonBackend() {
  if (isDev) {
    log('Development mode: Backend should be started by npm run backend');
    log('Checking if backend is running...');

    const healthy = await checkBackendHealth();
    if (healthy) {
      log('Backend is already running');
      return true;
    }

    log('Waiting for backend to start (started by concurrently)...');
    const ready = await waitForBackend(30000);

    if (ready) {
      log('Backend is ready');
      return true;
    }

    log('Backend not available - please ensure npm run backend is running');
    return false;
  }

  const backendPath = getPythonExecutable();
  const modelsPath = getModelsPath();

  log(`Starting Python backend: ${backendPath}`);
  log(`Models path: ${modelsPath}`);

  const healthy = await checkBackendHealth();
  if (healthy) {
    log('Backend already running');
    return true;
  }

  try {
    if (backendPath.endsWith('.exe')) {
      pythonProcess = spawn(backendPath, ['--models-path', modelsPath], {
        cwd: path.dirname(backendPath),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });
    } else {
      const scriptPath = getBackendScript();
      pythonProcess = spawn(backendPath, [scriptPath, '--models-path', modelsPath], {
        cwd: path.dirname(scriptPath),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });
    }

    pythonProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('HEAD') && !msg.includes('OPTIONS')) {
        log(`Backend: ${msg}`);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('HEAD') && !msg.includes('OPTIONS')) {
        console.error(`[Backend Error] ${msg}`);
      }
    });

    pythonProcess.on('error', (err) => {
      console.error(`[Backend] Failed to start: ${err.message}`);
    });

    pythonProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log(`Backend exited with code ${code}`);
      }
      pythonProcess = null;
    });

    log('Waiting for backend to be ready...');
    const ready = await waitForBackend(30000);

    if (ready) {
      log('Backend is ready');
      return true;
    }

    log('Backend failed to start within timeout');
    return false;

  } catch (err) {
    console.error(`[Backend] Error starting: ${err.message}`);
    return false;
  }
}

function stopPythonBackend() {
  if (!pythonProcess) {
    return;
  }

  log('Stopping Python backend...');

  try {
    if (isWindows) {
      try {
        execSync(`taskkill /PID ${pythonProcess.pid} /T /F`, { stdio: 'ignore' });
      } catch {
        pythonProcess.kill('SIGKILL');
      }
    } else {
      pythonProcess.kill('SIGTERM');
      setTimeout(() => {
        if (pythonProcess) {
          pythonProcess.kill('SIGKILL');
        }
      }, 2000);
    }
  } catch (err) {
    log(`Error stopping backend: ${err.message}`);
  }

  pythonProcess = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'public', 'icon-512.png'),
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  log(`Starting Offline PDF Reader (${isDev ? 'development' : 'production'} mode)`);

  const backendReady = await startPythonBackend();

  if (!backendReady) {
    log('Warning: Backend not available, some features may not work');
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isDev) {
    stopPythonBackend();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (!isDev) {
    stopPythonBackend();
  }
});

app.on('before-quit', () => {
  if (!isDev) {
    stopPythonBackend();
  }
});

ipcMain.handle('get-backend-url', () => {
  return BACKEND_URL;
});

ipcMain.handle('get-models-path', () => {
  return getModelsPath();
});

ipcMain.handle('check-backend-health', async () => {
  return await checkBackendHealth();
});
