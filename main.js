const { app, BrowserWindow } = require('electron');
const path = require('path');

// Impede que o instalador abra várias janelas durante a instalação no Windows
if (require('electron-squirrel-startup')) app.quit();

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true, // Deixa o sistema com cara de PDV profissional
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Começa pela tela do vendedor (index.html)
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
