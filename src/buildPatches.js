ngapp.controller('buildPatchesController', function($scope, $q, patcherService, patchBuilder) {
    // helper functions
    let getUsedFileNames = function() {
        let patchFileNames = $scope.patchPlugins.map(function(patchPlugin) {
            return patchPlugin.filename;
        });
        return xelib.GetLoadedFileNames(false).concat(patchFileNames);
    };

    let getNewPatchFilename = function() {
        let usedFileNames = getUsedFileNames(),
            patchFileName = 'Patch.esp',
            counter = 1;
        while (usedFileNames.includes(patchFileName)) {
            patchFileName = `Patch ${++counter}.esp`;
        }
        return patchFileName;
    };

    // scope functions
    $scope.patcherToggled = function(patcher) {
        $scope.settings[patcher.id].enabled = patcher.active;
    };

    $scope.patchFileNameChanged = function(patchPlugin) {
        patchPlugin.patchers.forEach(function(patcher) {
            $scope.settings[patcher.id].patchFileName = patchPlugin.filename;
        });
    };

    $scope.addPatchPlugin = function() {
        $scope.patchPlugins.push({
            filename: getNewPatchFilename(),
            patchers: []
        });
    };

    $scope.removePatchPlugin = (index) => $scope.patchPlugins.splice(index, 1);

    $scope.buildPatchPlugin = function(patchPlugin) {
        patchBuilder.buildPatchPlugins([patchPlugin]);
    };

    $scope.buildAllPatchPlugins = function() {
        patchBuilder.buildPatchPlugins($scope.patchPlugins);
    };

    $scope.updatePatchStatuses = function() {
        $scope.patchPlugins.forEach(function(patch) {
            patch.disabled = patch.patchers.reduce(function(b, patcher) {
                return b || !patcher.active;
            }, false) || !patch.patchers.length || !patch.filename.length;
        });
    };

    // event handlers
    $scope.$on('buildAllPatches', $scope.buildAllPatchPlugins);
    $scope.$on('addPatchPlugin', $scope.addPatchPlugin);
    $scope.$on('itemsReordered', $scope.updatePatchStatuses, true);

    // initialization
    patcherService.updateFilesToPatch();
    $scope.patchPlugins = patcherService.getPatchPlugins();
    $scope.updatePatchStatuses();
});
