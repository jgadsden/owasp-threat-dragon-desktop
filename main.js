'use strict';
  
const path = require('path');
const electron = require('electron');
const app = electron.app;
const setupEvents = require('./config/squirrel');
const log = require('electron-log');

var command;
if (setupEvents.handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
        return;
}

// use yargs to provide a command line interface
// can call it using './electron . --help' after 'ln -sf node_modules/electron/cli.js electron'
const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command({
    command: 'report <json> <pdf>',
    aliases: ['r', 'rep'],
    desc: 'Export a JSON threat model as a PDF report',
    handler: (argv) => {
      command = 'report';
      app.quit();
    }
  })
  .demandCommand(0, 0, '', 'Command not recognised')
  .options({
    'verbose': {
      alias: 'v',
      describe: 'Run with verbose logging',
      type: 'boolean'
    }
  })
  .count('verbose')
  .help()
  .wrap(80)
  .argv;

// set the log level to one of error, warn, info, verbose, debug, silly
let verboseLevel = argv.verbose;
if (verboseLevel == 0) {
  log.transports.console.level = 'error';
} else if (verboseLevel == 1) {
  log.transports.console.level = 'info';
} else if (verboseLevel == 2) {
  log.transports.console.level = 'debug';
} else {
  log.transports.console.level = 'silly';
}

// prevent window being garbage collected
let mainWindow;

function checkIfValidCommand() {
  if (command != 'report') {
    return false;
  }

  return true;
}

function doCommand() {

  log.debug('CLI called with command', command, 'and', process.argv.length, 'arguments, verbose level of', verboseLevel);
  log.info(`creating report ${argv.pdf} from ${argv.json}`)

}

function onClosed() {
  // dereference the window
  // for multiple windows store them in an array
  mainWindow = null;
}

function createCLI() {

  const modalPath = path.join('file://', __dirname, './index.html');

  var win = new electron.BrowserWindow({
    show: false,
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  log.info('Calling Threat Dragon with CLI interface');

  win.loadURL(modalPath);
  win.on('close', () => { win = null });
  win.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  return win;
}

function createMainWindow() {

  const modalPath = path.join('file://', __dirname, './index.html');
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

  log.info('Calling Threat Dragon with user interface');

  window.loadURL(modalPath);
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
  let isCliCommand = checkIfValidCommand();

  if (!mainWindow && !isCliCommand) {
    mainWindow = createMainWindow();
  }
});

app.on('ready', () => {
  let isCliCommand = checkIfValidCommand();

  if (!isCliCommand) {
    mainWindow = createMainWindow();
  } else {
    mainWindow = createCLI();
    doCommand();
  }

  mainWindow.once('ready-to-show', () => {
    if (!isCliCommand) {
      mainWindow.show();
      mainWindow.maximize();
    }
  });

});
