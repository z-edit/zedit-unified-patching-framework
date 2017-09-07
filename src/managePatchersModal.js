ngapp.controller('managePatchersModalController', function($scope, patcherService, modalService, errorService) {
    // inherited functions
    modalService.buildUnfocusModalFunction($scope, 'closeModal');

    // helper function
    let selectTab = function(tab) {
        $scope.tabs.forEach((tab) => tab.selected = false);
        $scope.currentTab = tab;
        $scope.currentTab.selected = true;
        $scope.onBuildPatchesTab = $scope.currentTab.label === 'Build Patches';
    };

    let getNewPatchFilename = function() {
        let patchFileNames = $scope.patchPlugins.map(function(patchPlugin) {
                return patchPlugin.filename;
            }),
            usedFileNames = xelib.GetLoadedFileNames().concat(patchFileNames);
        let patchFileName = 'Patch.esp',
            counter = 1;
        while (usedFileNames.contains(patchFileName)) {
            patchFileName = `Patch ${++counter}.esp`;
        }
        return patchFileName;
    };

    let build = function(patchPlugin) {
        patchPlugin.patchers.forEach(function(patcher) {
            patcherService.executePatcher($scope, patcher.id);
        });
    };

    let wrapPatchers = function(callback) {
        xelib.CreateHandleGroup();
        try {
            callback();
        } catch (e) {
            errorService.handleException(e);
        } finally {
            patcherService.clearCache();
            xelib.FreeHandleGroup();
            $scope.$root.$broadcast('fileAdded');
        }
    };

    // initialize scope variables
    $scope.patchPlugins = patcherService.getPatchPlugins();
    $scope.settings = patcherService.settings;
    $scope.tabs = patcherService.getTabs();
    selectTab($scope.tabs[0]);

    // scope functions
    $scope.closeModal = function() {
        patcherService.saveSettings();
        $scope.$emit('closeModal');
    };

    $scope.onTabClick = function(e, tab) {
        e.stopPropagation();
        if (tab === $scope.currentTab) return;
        selectTab(tab);
    };

    $scope.patcherToggled = function(patcher) {
        $scope.settings[patcher.id].enabled = patcher.active;
    };

    $scope.patchFileNameChanged = function(patchPlugin) {
        patchPlugin.patchers.forEach(function(patcher) {
            $scope.settings[patcher.id].patchFileName = patchPlugin.filename;
        });
    };

    $scope.addPatchPlugin = function() {
        $scope.patchPlugins.push({ filename: getNewPatchFilename() });
    };

    $scope.removePatchPlugin = (index) => $scope.patchPlugins.splice(index, 1);

    $scope.buildPatchPlugin = function(patchPlugin) {
        wrapPatchers(() => build(patchPlugin));
    };

    $scope.buildAllPatchPlugins = function() {
        wrapPatchers(function() {
            $scope.patchPlugins.forEach((patchPlugin) => build(patchPlugin));
        });
    };
});