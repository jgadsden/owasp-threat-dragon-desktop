'use strict';
  
const path = require('path');
const electron = require('electron');
const app = electron.app;
const setupEvents = require('./config/squirrel');
if (setupEvents.handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
        return;
}

// use yargs to provide a command line interface
// can call it using './electron . --help' after 'ln -sf node_modules/electron/cli.js electron'
var command;
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
const log = require('./logger').init(argv.verbose);

// prevent window being garbage collected
let mainWindow;

function checkIfCliCommand() {
  return (command != null);
}

function doCommand() {

  log.debug('CLI command', command, 'with', process.argv.length, 'arguments');

  if (command == 'report') {
    log.info(`creating report ${argv.pdf} from ${argv.json}`)
  } else {
    log.warn('unrecognised command', command);
  }

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
    width: 0,
    height: 0,
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
  if (!mainWindow && !checkIfCliCommand()) {
    mainWindow = createMainWindow();
  }
});

app.on('ready', () => {
  let isCliCommand = checkIfCliCommand();

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
