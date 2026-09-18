const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'श्री साई इंटरप्राइजेस (Shri Sai Enterprises) - Desktop ERP',
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      spellcheck: true,
    },
    autoHideMenuBar: false,
  });

  // Load production build or local dev server
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external links (WhatsApp, Google Maps, Bank, etc.) safely in external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Set standard clean Windows menu
  createApplicationMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createApplicationMenu() {
  const template = [
    {
      label: 'फाईल (File)',
      submenu: [
        {
          label: 'नवीन विक्री बिल (New Bill)',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('nav-to', 'add-entry');
          }
        },
        {
          label: 'कार्ड हफ्ता पावती (Card Collection)',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('nav-to', 'card-scheme');
          }
        },
        { type: 'separator' },
        {
          label: 'प्रिंट करा (Print Invoice)',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print({ silent: false, printBackground: true });
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'बाहेर पडा (Exit)' }
      ]
    },
    {
      label: 'संपादित (Edit)',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'selectAll', label: 'Select All' }
      ]
    },
    {
      label: 'दृश्य (View)',
      submenu: [
        { role: 'reload', label: 'ताजे करा (Refresh)' },
        { role: 'forceReload', label: 'हार्ड रीफ्रेश (Hard Refresh)' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'सामान्य आकार (Actual Size)' },
        { role: 'zoomIn', label: 'झूम इन (Zoom In)' },
        { role: 'zoomOut', label: 'झूम आउट (Zoom Out)' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'फुल स्क्रीन (Full Screen)' }
      ]
    },
    {
      label: 'मदत व माहिती (Help)',
      submenu: [
        {
          label: 'वेबसाईट उघडा (ShriSaiEnt.in)',
          click: () => shell.openExternal('https://shrisaient.in')
        },
        {
          label: 'व्हॉट्सॲप सपोर्ट (WhatsApp Help)',
          click: () => shell.openExternal('https://wa.me/918766486915?text=Hello%20Shri%20Sai%20Enterprises')
        },
        { type: 'separator' },
        {
          label: 'Shri Sai Enterprises Desktop v1.0',
          enabled: false
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
