import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { BrowserWindow, app, dialog, ipcMain } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#1a1a2e',
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Get the path to the Bun executable and scanner
function getBunPath(): string {
  // In production, we'd bundle Bun or use a different approach
  // For now, assume Bun is available in PATH
  return 'bun';
}

function getScannerPath(): string {
  if (isDev) {
    return join(__dirname, '../../src/cli.ts');
  }
  return join(process.resourcesPath, 'scanner/cli.ts');
}

// IPC Handlers
ipcMain.handle('scan-crash-log', async (_event, filePath: string, game?: string) => {
  return new Promise((resolve, reject) => {
    const args = ['run', getScannerPath(), 'json', filePath];
    if (game) {
      args.push('--game', game);
    }

    const child = spawn(getBunPath(), args, {
      cwd: isDev ? join(__dirname, '../..') : process.resourcesPath,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch {
          resolve({ status: 'completed', issues: [], rawOutput: stdout });
        }
      } else {
        reject(new Error(stderr || `Scanner exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
});

ipcMain.handle('get-app-info', async () => {
  return {
    name: 'CLASSIC',
    title: 'Crash Log Auto Scanner & Setup Integrity Checker',
    version: app.getVersion(),
  };
});

ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) {
    return null;
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Crash Logs', extensions: ['log', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (_event, defaultName: string) => {
  if (!mainWindow) {
    return null;
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  return result.filePath;
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
