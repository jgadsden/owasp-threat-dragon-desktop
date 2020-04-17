'use strict';
  
const path = require('path');
const electron = require('electron');
const app = electron.app;
const setupEvents = require('./config/squirrel');
if (setupEvents.handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
        return;
}
const argv = require('yargs')
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .argv;

// prevent window being garbage collected
let mainWindow;

function checkIfCalledViaCLI(args) {
  if(args && args.length > 2){
    return true;
  }
  return false;
}

function onClosed() {
  // dereference the window
  // for multiple windows store them in an array
  mainWindow = null;
}

function createMainWindow() {

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  var window = new electron.BrowserWindow({
    title: "OWASP Threat Dragon",
    icon: path.join(__dirname, './content/icons/png/64x64.png'),
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true
    }
  });

  window.loadURL(`file://${__dirname}/index.html`);
  window.on('closed', onClosed);
  window.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  return window;
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow();
  }
});

app.on('ready', () => {
  let isCalledViaCLI = checkIfCalledViaCLI(process.argv);

  if (isCalledViaCLI) {
    mainWindow = new electron.BrowserWindow({ show: false, width: 0, height: 0});
    if (argv.verbose) {
      console.log("called with argument number", process.argv.length);
    }
    app.quit();
  } else {
    mainWindow = createMainWindow();
  }

  mainWindow.once('ready-to-show', () => {
    if (isCalledViaCLI) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.maximize();
    }
  });

});
