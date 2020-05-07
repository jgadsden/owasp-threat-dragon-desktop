'use strict';
  
const path = require('path');
const electron = require('electron');
const app = electron.app;
const setupEvents = require('./config/squirrel');
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
      if (argv.verbose) {
        console.log(`creating report ${argv.pdf} from ${argv.json}`)
      }
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
  .help()
  .wrap(80)
  .argv;

// prevent window being garbage collected
let mainWindow;

function checkIfValidCommand() {
  if (command != 'report') {
    return false;
  }

  return true;
}

function doCommand() {

  mainWindow.hide();

  if (argv.verbose) {
    console.log('CLI called with command', command, 'and', process.argv.length, 'arguments');
  }

}

function onClosed() {
  // dereference the window
  // for multiple windows store them in an array
  mainWindow = null;
}

function createCLI() {
  var window = new electron.BrowserWindow({ show: false, width: 0, height: 0});

  if (argv.verbose) {
    console.log('Calling Threat Dragon with CLI interface');
  }

  window.loadURL(`file://${__dirname}/index.html`);
  window.on('closed', onClosed);
  window.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  return window;
}

function createMainWindow() {

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  if (argv.verbose) {
    console.log('Calling Threat Dragon with user interface');
  }

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
