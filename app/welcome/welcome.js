'use strict';

function welcome($scope, $location, $route, common, electron, threatmodellocator) {

    log.debug('Welcome logger verbosity level', log.transports.console.level);

    /*jshint validthis: true */
    var fs = require('fs');
    var controllerId = 'welcome';
    var logError = common.logger.getLogFn(controllerId, 'error');
    var vm = this;
    var getLogFn = common.logger.getLogFn;
    var logInfo = getLogFn(controllerId);

    // Bindable properties and functions are placed on vm
    vm.title = 'Welcome';
    vm.openModel = openModel;
    vm.openNewModel = openNewModel;

    activate();

    function activate() {
        log.debug('Welcome -> activate');
        common.activateController([], controllerId).then(function () { logInfo('Activated Welcome View'); });
    }

    function openModel() {
        electron.dialog.open(function (fileNames) {
            log.debug('Welcome -> openModel', fileNames[0]);
            var path = threatmodellocator.getModelPath(fileNames[0]);
            if ($location.path() == '/threatmodel/' + path) {
                $route.reload();
            } else {
                $location.path('/threatmodel/' + path);
            }
            log.debug('Welcome -> openModel path', $location.path());
            $scope.$apply();
        },
        function() {});
    }

    function openNewModel() {
        log.debug('Welcome -> openNewModel');
        var model = { summary: { title: "New Threat Model" }, detail: { contributors: [], diagrams: [] } };
        var success = true;
        electron.dialog.save(function (fileName) {
            fs.writeFileSync( fileName, JSON.stringify(model), 'utf8', function (err) {
                if (err) {
                    logError(err);
                    success = false;
                    log.error(err);
                }
            });
            if (success) {
                var path = threatmodellocator.getModelPath( fileName );
                $location.path('/threatmodel/' + path);
                log.debug('Welcome -> openNewModel path', $location.path());
                $scope.$apply();
            }
        },
        function() {});
    }
}

module.exports = welcome;
