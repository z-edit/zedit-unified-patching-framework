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

    let getDisabledHint = function(patchPlugin) {
        if (patchPlugin.filename.length === 0)
            return 'Patch plugin filename cannot be empty.';
        let enabledPatchers = patchPlugin.patchers.filter(p => p.active);
        if (enabledPatchers.length === 0)
            return 'No patchers to build.';
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
        $scope.patchPlugins.forEach(patchPlugin => {
            patchPlugin.disabledHint = getDisabledHint(patchPlugin);
            patchPlugin.disabled = !!patchPlugin.disabledHint;
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
