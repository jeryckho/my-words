'use strict'

import fs from 'fs'
import { app, protocol, BrowserWindow, dialog, ipcMain } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
if (isDevelopment) {
  // Don't load any native (external) modules until the following line is run:
  require('module').globalPaths.push(process.env.NODE_MODULES_PATH)
}

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let Modified = "0";
let isClosing = false;
let mainWindow

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })
function createMainWindow () {
  const window = new BrowserWindow({
    width:800,
    height:600,
    icon: path.join(__dirname, 'assets/feather.png')
  })

  if (isDevelopment) {
    // Load the url of the dev server if in development mode
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) window.webContents.openDevTools()
  } else {
    createProtocol('app')
    //   Load the index.html when not in development
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
      })
    )
  }

  window.on('close', (e) => {
    if (!isClosing) {
      e.preventDefault();
      if (Modified != "0") {
        let ret = dialog.showMessageBox(window,{
          buttons:["Oui", "Non"],
          message:"Il y a des modifications non sauvegardées. Etes-vous sûr de vouloir quitter ?",
          cancelId:1
        });
        if (ret != 1) {
          mainWindow.webContents.send('closing')
        }
      } else {
        mainWindow.webContents.send('closing')
      }
    }
  })

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  mainWindow = createMainWindow()
})

ipcMain.on('update-notify-value', function(event, arg) {
  Modified = arg;
})

ipcMain.on('ok-to-close', function() {
  isClosing = true;
  app.quit();
})

ipcMain.on('print-pdf', function(event, arg) {

  let window_to_PDF = new BrowserWindow({show : false});
  let title = arg.title ? `<h1>${arg.title}</h1>` : '';
  let footer = arg.pg ? `<div class="footer">${arg.pg}<span class="pagenum"></span></div>` : ''; 
  let style = arg.style ? arg.style : 'p {text-align:justify}';
  if (arg.pg) {
    style = style + " .footer { position: fixed; bottom: 0px; } .pagenum:before { content: counter(page); }";
  }
  let htm = `<html><head><meta charset="utf-8"><style>${style}</style></head><body>${footer}${title}${arg.mk}</body></html>`;

  toString
  if (arg.file.endsWith('pdf')) {
    window_to_PDF.loadURL("data:text/html;charset=utf-8," + encodeURI(htm));
    window_to_PDF.webContents.on('did-finish-load', () => {
      window_to_PDF.webContents.printToPDF({
        landscape: false,
        marginsType: 0,
        printBackground: false,
        printSelectionOnly: false,
        pageSize: "A4",
      }, function(err, data) {
        if (err) {
            return;
        }
        try{
            fs.writeFileSync(arg.file, data);
        } catch(err){
        }
      })
    })
  } else {
    try{
      fs.writeFileSync(arg.file, htm);
    } catch(err){
    }
  }
})
