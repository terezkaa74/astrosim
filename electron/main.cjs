const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getPythonBackendPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'python-backend', 'main.py');
  }
  return path.join(process.resourcesPath, 'python-backend', 'main.exe');
}

function getModelsPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'models');
  }
  return path.join(process.resourcesPath, 'models');
}

function startPythonBackend() {
  const backendPath = getPythonBackendPath();
  const modelsPath = getModelsPath();

  console.log('Starting Python backend:', backendPath);
  console.log('Models path:', modelsPath);

  if (isDev) {
    pythonProcess = spawn('python', [backendPath, '--models-path', modelsPath], {
      cwd: path.dirname(backendPath)
    });
  } else {
    pythonProcess = spawn(backendPath, ['--models-path', modelsPath]);
  }

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Backend: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Backend Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python backend exited with code ${code}`);
  });

  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
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
    icon: path.join(__dirname, '..', 'public', 'icon-512.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

ipcMain.handle('get-backend-url', () => {
  return 'http://localhost:8000';
});

ipcMain.handle('get-models-path', () => {
  return getModelsPath();
});
