'use strict';

function desktopreport($q, $routeParams, $location, common, datacontext, threatmodellocator, electron) {

    log.debug('Desktop Report logger verbosity level', log.transports.console.level);

    var fsp = require('promise-fs');
    /*jshint validthis: true */
    var vm = this;
    var controllerId = 'desktopreport';
    var getLogFn = common.logger.getLogFn;
    var logInfo = getLogFn(controllerId);
    var logSuccess = getLogFn(controllerId, 'success');
    var logError = getLogFn(controllerId, 'error');

    // Bindable properties and functions are placed on vm.
    vm.title = 'Threat Model Report';
    vm.threatModel = {};
    vm.error = null;
    vm.loaded = false;
    vm.onLoaded = onLoaded;
    vm.onError = onError;
    vm.savePDF = savePDF;
    vm.printPDF = printPDF;
    vm.exportPDF = exportPDF;

    activate();

    function activate() {
        common.activateController([getThreatModel()], controllerId)
            .then(function () { 
//                      exportPDF();
                      log.info('Activated Desktop Report Controller');
                  });
    }

    function getThreatModel(forceReload) {
        var location = threatModelLocation();
        log.debug('Desktop Report get Threat Model from location', location);

        return datacontext.load(location, forceReload).then(onLoad, onError);

        function onLoad(data) {
            vm.threatModel = data;
            return vm.threatModel;
        }
    }

    function onLoaded() {
        log.debug('Desktop Report loaded Threat Model location', threatModelLocation());
        vm.loaded = true;
        return 'called onLoaded';
    }

    function onError(err) {
        vm.error = err;
        logError(err.data.message);
        log.error('Desktop Report', err.data.message);
    }

    function threatModelLocation() {
        return threatmodellocator.getModelLocation($routeParams);
    }

    function exportPDF() {
        log.debug('Desktop Report export PDF');
        electron.currentWindow.webContents.printToPDF(pdfSettings, onExported);

        function pdfSettings() {

            var option = {
                landscape: false,
                marginsType: 0,
                printBackground: false,
                printSelectionOnly: false,
                pageSize: 'A4',
            };

            return option;
        }

        function onExported(error, data) {
            log.debug('Desktop Report on export PDF');
            var pdfPath = datacontext.threatModelLocation.replace('.json', '.pdf');
            if (error) {
                done();
                onError(error);
            } else {
                fsp.writeFile(pdfPath, data).then(function() { 
                    log.debug('Desktop Report exported PDF to', pdfPath);
                });
            }
        }
    }

    function savePDF(done) {
        log.debug('Desktop Report save PDF');
        electron.currentWindow.webContents.printToPDF(pdfSettings, onSaved);

        function pdfSettings() {

            var option = {
                landscape: false,
                marginsType: 0,
                printBackground: false,
                printSelectionOnly: false,
                pageSize: 'A4',
            };

            return option;
        }

        function onSaved(error, data) {
            log.debug('Desktop Report on save PDF');
            if (error) {
                done();
                onError(error);
            } else {

                var defaultPath = null;
                if (datacontext.threatModelLocation) {
                    defaultPath = datacontext.threatModelLocation.replace('.json', '.pdf');
                }

                electron.dialog.savePDF(defaultPath, function (fileName) {
                    fsp.writeFile(fileName, data).then(function() { 
                        log.debug('Desktop Report saved PDF');
                        done();
                    });
                },
                function() {
                    logInfo('Cancelled save threat model');
                    log.info('Cancelled save threat model');
                    done();
                });
            }
        }
    }
    
    function printPDF(done) {
        log.debug('Desktop Report print PDF');

        //use default print options
        var printSettings = {};

        electron.currentWindow.webContents.print(printSettings, onPrinted);
        
        function onPrinted(success) {
            if (success) {
                logSuccess('Report printed successfully');
                log.info('Desktop Report printed successfully');
                done();
            } else {
                // see Electron issue https://github.com/electron/electron/issues/19008
                // application will "hang" if the print dialog is cancelled
                // calling reload instead of done is a temporary workaround
                // it looks bad but the app keeps working
                logError('Report printing failed');
                log.error('Desktop Report printing failed');
                electron.currentWindow.webContents.reload();
            }
        }
    }
}

module.exports = desktopreport;
