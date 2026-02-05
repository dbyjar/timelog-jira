const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Initialize electron-store for settings
const Store = require('electron-store');
const store = new Store();

let tray = null;
let window = null;

function createWindow() {
  window = new BrowserWindow({
    width: 380,
    height: 460,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  window.loadFile('index.html');

  window.on('blur', () => {
    window.hide();
  });
}

function toggleWindow() {
  if (window.isVisible()) {
    window.hide();
  } else {
    const trayBounds = tray.getBounds();
    const windowBounds = window.getBounds();
    
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    const y = Math.round(trayBounds.y + trayBounds.height + 4);
    
    window.setPosition(x, y, false);
    window.show();
    window.focus();
  }
}

function createIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect width="16" height="16" rx="3" fill="#0052cc"/>
    <text x="8" y="12" font-size="10" fill="white" text-anchor="middle" font-family="Arial">T</text>
  </svg>`;
  return nativeImage.createFromBuffer(Buffer.from(svg));
}

function getStorageFolder() {
  return store.get('storageFolder', path.join(os.homedir(), 'Documents'));
}

function setStorageFolder(folderPath) {
  store.set('storageFolder', folderPath);
}

async function selectFolder() {
  const result = await dialog.showOpenDialog(window, {
    properties: ['openDirectory'],
    title: 'Select Folder for Time Logs',
    defaultPath: getStorageFolder()
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    setStorageFolder(selectedPath);
    return { success: true, path: selectedPath };
  }
  return { success: false };
}

function checkFirstRun() {
  const hasRunBefore = store.get('hasRunBefore', false);
  if (!hasRunBefore) {
    store.set('hasRunBefore', true);
    return true;
  }
  return false;
}

app.whenReady().then(() => {
  tray = new Tray(createIcon());
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: toggleWindow },
    { type: 'separator' },
    { 
      label: 'Change Storage Folder', 
      click: async () => {
        const result = await selectFolder();
        if (result.success) {
          // Show notification
          if (Notification.isSupported()) {
            new Notification({
              title: 'TimeLog JIRA',
              body: `Storage folder changed to: ${result.path}`,
              icon: createIcon()
            }).show();
          }
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('TimeLog JIRA');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', toggleWindow);
  
  createWindow();
  
  // Check if first run and prompt for folder selection
  if (checkFirstRun()) {
    setTimeout(async () => {
      toggleWindow();
      const result = await selectFolder();
      if (result.success) {
        window.webContents.send('folder-selected', result.path);
      }
    }, 500);
  }
});

app.on('window-all-closed', () => {
  // Keep app running in menu bar
});

// Handle CSV save
ipcMain.handle('save-log', async (event, data) => {
  const storageFolder = getStorageFolder();
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const filename = `task_log_${dateStr}.csv`;
  const filepath = path.join(storageFolder, filename);

  const csvLine = `"${data.ticketNo}","${data.startDate}","${data.timeSpent}","${data.comment}"\n`;

  try {
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, 'Ticket No,Start Date,Timespent,Comment\n');
    }
    fs.appendFileSync(filepath, csvLine);
    return { success: true, filepath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle getting current storage folder
ipcMain.handle('get-storage-folder', () => {
  return getStorageFolder();
});

// Handle selecting new storage folder
ipcMain.handle('select-folder', async () => {
  return await selectFolder();
});

// Handle alert notifications
ipcMain.on('show-alert', (event, data) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: data.title,
      body: data.body,
      icon: createIcon()
    });
    notification.show();
  }
});
