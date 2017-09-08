ngapp.controller('buildPatchesController', function($scope, patcherService, patchBuilder, errorService) {
    // helper functions
    let getNewPatchFilename = function() {
        let patchFileNames = $scope.patchPlugins.map(function(patchPlugin) {
                return patchPlugin.filename;
            }),
            usedFileNames = xelib.GetLoadedFileNames().concat(patchFileNames);
        let patchFileName = 'Patch.esp',
            counter = 1;
        while (usedFileNames.includes(patchFileName)) {
            patchFileName = `Patch ${++counter}.esp`;
        }
        return patchFileName;
    };

    let build = function(patchPlugin) {
        let patchFile = patchBuilder.preparePatchFile(patchPlugin.filename);
        patchPlugin.patchers.forEach(function(patcher) {
            if (!patcher.active) return;
            patchBuilder.executePatcher($scope, patcher.id, patchFile);
        });
        patchBuilder.cleanPatchFile(patchFile);
    };

    let wrapPatchers = function(callback) {
        xelib.CreateHandleGroup();
        try {
            callback();
        } catch (e) {
            errorService.handleException(e);
        } finally {
            patchBuilder.clearCache();
            xelib.FreeHandleGroup();
            $scope.$root.$broadcast('fileAdded');
        }
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
        wrapPatchers(() => build(patchPlugin));
    };

    $scope.buildAllPatchPlugins = function() {
        wrapPatchers(function() {
            $scope.patchPlugins
                .filter((patchPlugin) => { return !patchPlugin.disabled })
                .forEach((patchPlugin) => build(patchPlugin));
        });
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
