const electron = require('electron')
const { app, BrowserWindow } = electron
const menu = electron.Menu

let mainWin;

function createWindow() {
  mainWin = new BrowserWindow({
    minWidth: 1000,
    minHeight: 600,
    show: false,
    center: true,
    backgroundColor: '#F6F8FA',
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWin.maximize()

  mainWin.loadFile('./pages/home/index.html')

  mainWin.webContents.openDevTools()

  mainWin.on('close', () => {
    mainWin = null
    if (app) app.quit()
  })

  mainWin.webContents.once('did-finish-load', () => {
    mainWin.show()
  })
}

app.on('ready', () => {
  createWindow()
  menu.setApplicationMenu(null)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWin === null) {
    createWindow()
  }
})
