const log = require('electron-log');

exports.init = function (level = 0) {

  // set the log level to one of error, warn, info, verbose, debug, silly
  if (level == 0) {
    log.transports.console.level = 'error';
  } else if (level == 1) {
    log.transports.console.level = 'info';
  } else if (level == 2) {
    log.transports.console.level = 'debug';
  } else {
    log.transports.console.level = 'silly';
  }
  log.transports.file.level = log.transports.console.level;

  log.info('CLI called with verbosity level', log.transports.console.level);

  return log;
}

