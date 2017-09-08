/* global ngapp, xelib */
// helper variables and functions
const modulePath = '../modules/unifiedPatchingFramework';
const openManagePatchersModal = function(scope) {
  scope.$emit('openModal', 'managePatchers', {
    templateUrl: `${modulePath}/partials/managePatchersModal.html`
  });
};

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
                return b || !patcher.active || patcher.filename.length === 0;
            }, false) || !patch.patchers.length;
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

ngapp.directive('ignorePlugins', function() {
    return {
        restrict: 'E',
        scope: {
            patcherId: '@'
        },
        templateUrl: `${modulePath}/partials/ignorePlugins.html`,
        controller: 'ignorePluginsController'
    }
});

ngapp.controller('ignorePluginsController', function($scope, patcherService) {
    // helper functions
    let updateIgnoredFiles = function() {
        patcherSettings.ignoredFiles = $scope.ignoredPlugins
            .filter((item) => { return !item.invalid; })
            .map((item) => { return item.filename; });
    };

    let getValid = function(item, itemIndex) {
        let filename = item.filename,
            isRequired = $scope.requiredPlugins.includes(filename),
            duplicate = $scope.ignoredPlugins.find(function(item, index) {
                return item.filename === filename && index < itemIndex;
            });
        return !isRequired && !duplicate;
    };

    // scope functions
    $scope.toggleExpanded = function() {
        if ($scope.ignoredPlugins.length === 0) return;
        $scope.expanded = !$scope.expanded;
    };

    $scope.addIgnoredPlugin = function() {
        if (!$scope.expanded) $scope.expanded = true;
        $scope.ignoredPlugins.push({ filename: 'Plugin.esp' });
        $scope.onChange();
    };

    $scope.removeIgnoredPlugin = function(index) {
        $scope.ignoredPlugins.splice(index, 1);
        $scope.onChange();
    };

    $scope.onChange = function() {
        $scope.ignoredPlugins.forEach(function(item, index) {
            item.invalid = !getValid(item, index);
        });
        updateIgnoredFiles();
    };

    // initialization
    if (!$scope.patcherId) {
        throw 'ignorePlugins Directive: patcher-id is required.';
    }

    let patcher = patcherService.getPatcher($scope.patcherId),
        patcherSettings = patcherService.settings[$scope.patcherId],
        ignoredFiles = patcherSettings.ignoredFiles;

    $scope.requiredPlugins = patcher.requiredFiles || [];
    $scope.ignoredPlugins = ignoredFiles.map(function (filename) {
        return {filename: filename};
    });
});
ngapp.controller('managePatchersModalController', function($scope, patcherService, modalService) {
    // inherited functions
    modalService.buildUnfocusModalFunction($scope, 'closeModal');

    // helper functions
    let selectTab = function(tab) {
        $scope.tabs.forEach((tab) => tab.selected = false);
        $scope.currentTab = tab;
        $scope.currentTab.selected = true;
        $scope.onBuildPatchesTab = $scope.currentTab.label === 'Build Patches';
    };

    // initialize scope variables
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
});
ngapp.service('patchBuilder', function(patcherService) {
    let cache = {};

    // private functions
    let getOrCreatePatchRecord = function(patchFile, record) {
        return xelib.AddElement(patchFile, xelib.HexFormID(record));
    };

    let getFile = function(filename) {
        if (!cache[filename]) {
            cache[filename] = { handle: xelib.FileByName(filename) };
        }
        return cache[filename];
    };

    let getRecords = function(filename, search, includeOverrides) {
        let file = getFile(filename),
            cacheKey = `${search}_${+includeOverrides}`;
        if (!file[cacheKey]) {
            file[cacheKey] = xelib.GetRecords(file.handle, search, includeOverrides);
        }
        return file[cacheKey];
    };

    let getPatcherHelpers = function(patcher) {
        return {
            LoadRecords: function(search, includeOverrides = false) {
                let filesToPatch = getFilesToPatch(patcher);
                return filesToPatch.reduce(function(records, filename) {
                    return records.concat(getRecords(filename, search, includeOverrides));
                }, []);
            },
            AllSettings: patcherService.settings
            // TODO: More helpers here?
        }
    };

    let addRequiredMastersToPatch = function(filename, patchPlugin) {
        let plugin = getFile(filename);
        xelib.GetMasterNames(plugin.handle).forEach(function(masterName) {
            xelib.AddMaster(patchPlugin, masterName)
        });
        xelib.AddMaster(patchPlugin, filename);
    };

    let getRecordsToPatch = function(load, filename, settings, locals) {
        let plugin = getFile(filename),
            loadOpts = load(plugin.handle, settings, locals);
        if (!loadOpts) return [];
        let records = getRecords(filename, loadOpts.signature, false);
        return loadOpts.filter ? records.filter(loadOpts.filter) : records;
    };

    let executeProcessBlock = function(processBlock, patchFile, settings, locals) {
        let load = processBlock.load,
            patch = processBlock.patch;
        settings.filesToPatch.forEach(function(filename) {
            let recordsToPatch = getRecordsToPatch(load, filename, settings, locals);
            if (recordsToPatch.length === 0) return;
            addRequiredMastersToPatch(filename, patchFile);
            recordsToPatch.forEach(function(record) {
                let patchRecord = getOrCreatePatchRecord(patchFile, record);
                patch(patchRecord, settings, locals);
            });
        });
    };

    // public functions
    this.executePatcher = function(scope, patcherId, patchFile) {
        let patcher = patcherService.getPatcher(patcherId),
            exec = patcher.execute,
            settings = patcherService.settings[patcherId],
            helpers = getPatcherHelpers(patcher),
            locals = {};

        exec.initialize && exec.initialize(patchFile, helpers, settings, locals);
        exec.process && exec.process.forEach(function(processBlock) {
            executeProcessBlock(processBlock, patchFile, settings, locals);
        });
        exec.finalize && exec.finalize(patchFile, helpers, settings, locals);
    };

    this.preparePatchFile = function(filename) {
        if (!xelib.HasElement(0, filename)) {
            let dataPath = xelib.GetGlobal('DataPath');
            fh.jetpack.cwd(dataPath).remove(filename);
        }
        let patchFile = xelib.AddElement(0, filename);
        xelib.NukeFile(patchFile);
        return patchFile;
    };

    this.cleanPatchFile = function(patchFile) {
        xelib.CleanMasters(patchFile);
    };

    this.clearCache = () => cache = {};
});
ngapp.service('patcherService', function($rootScope, settingsService) {
    let service = this,
        patchers = [],
        tabs = [{
            label: 'Build Patches',
            templateUrl: `${modulePath}/partials/buildPatches.html`,
            controller: 'buildPatchesController'
        }];

    // private functions
    let getPatcherEnabled = function(patcher) {
        return service.settings[patcher.info.id].enabled;
    };

    let getPatcherDisabled = function(patcher) {
        let loadedFiles = xelib.GetLoadedFileNames(),
            requiredFiles = patcher.requiredFiles || [];
        return requiredFiles.subtract(loadedFiles).length > 0;
    };

    let getDisabledHint = function(patcher) {
        let loadedFiles = xelib.GetLoadedFileNames(),
            requiredFiles = patcher.requiredFiles || [],
            hint = 'This patcher is disabled because the following required' +
                '\r\nfiles are not loaded:';
        requiredFiles.subtract(loadedFiles).forEach(function(filename) {
            hint += `\r\n - ${filename}`;
        });
        return hint;
    };

    let getDefaultSettings = function(patcher) {
        let defaultSettings = patcher.settings.defaultSettings || {};
        Object.deepAssign(defaultSettings, {
            patchFileName: 'zPatch.esp',
            ignoredFiles: [],
            enabled: true
        });
        return defaultSettings;
    };

    let buildSettings = function(settings) {
        let defaults = {};
        patchers.forEach(function(patcher) {
            let patcherSettings = {};
            patcherSettings[patcher.info.id] = getDefaultSettings(patcher);
            Object.deepAssign(defaults, patcherSettings);
        });
        return Object.deepAssign(defaults, settings);
    };

    let getFilesToPatchHint = function(patcher) {
        let filesToPatch = patcher.filesToPatch,
            hint = filesToPatch.slice(0, 40).join(', ');
        if (filesToPatch.length > 40) hint += '...';
        return hint.wordwrap();
    };

    let getFilesToPatch = function(patcher) {
        let patcherSettings = service.settings[patcher.info.id],
            ignored = patcherSettings.ignoredFiles;
            filesToPatch = xelib.GetLoadedFileNames().filter(function(filename) {
                return !filename.endsWith('.Hardcoded.dat');
            });
        if (patcher.getFilesToPatch) patcher.getFilesToPatch(filesToPatch);
        filesToPatch = filesToPatch.subtract(ignored);
        return filesToPatch;
    };

    let createPatchPlugin = function(patchPlugins, patchFileName) {
        let patchPlugin = { filename: patchFileName, patchers: [] };
        patchPlugins.push(patchPlugin);
        return patchPlugin;
    };

    let getPatchPlugin = function(patcher, patchPlugins) {
        let patcherSettings = service.settings[patcher.info.id],
            patchFileName = patcherSettings.patchFileName;
        return patchPlugins.find(function(patchPlugin) {
            return patchPlugin.filename === patchFileName;
        }) || createPatchPlugin(patchPlugins, patchFileName);
    };

    // public functions
    this.getPatcher = function(id) {
        return patchers.find((patcher) => { return patcher.info.id === id; });
    };

    this.registerPatcher = function(patcher) {
        if (!!service.getPatcher(patcher.info.id)) return;
        patchers.push(patcher);
        if (!patcher.settings) return;
        tabs.push(patcher.settings);
    };

    this.loadSettings = function() {
        let profileName = settingsService.currentProfile;
        service.settingsPath = `profiles/${profileName}/patcherSettings.json`;
        let settings = fh.loadJsonFile(service.settingsPath, {});
        service.settings = buildSettings(settings);
        service.saveSettings();
    };

    this.saveSettings = function() {
        fh.saveJsonFile(service.settingsPath, service.settings);
    };

    this.getTabs = function() {
        return tabs.map(function(tab) {
            return {
                label: tab.label,
                templateUrl: tab.templateUrl,
                controller: tab.controller
            };
        });
    };

    this.updateFilesToPatch = function() {
        patchers.forEach(function(patcher) {
            patcher.filesToPatch = getFilesToPatch(patcher);
        });
    };

    this.getPatchPlugins = function() {
        let patchPlugins = [];
        patchers.forEach(function(patcher) {
            let patchPlugin = getPatchPlugin(patcher, patchPlugins),
                disabled = getPatcherDisabled(patcher);
            patchPlugin.patchers.push({
                id: patcher.info.id,
                name: patcher.info.name,
                active: !disabled && getPatcherEnabled(patcher),
                disabled: disabled,
                disabledHint: disabled ? getDisabledHint(patcher) : '',
                filesToPatch: patcher.filesToPatch,
                filesToPatchHint: getFilesToPatchHint(patcher)
            });
        });
        return patchPlugins;
    };
});
ngapp.controller('upfSettingsController', function($timeout, $scope) {
    $scope.managePatchers = function() {
        $scope.saveSettings(false);
        $timeout(() => openManagePatchersModal($scope));
    };
});

// add manage patchers context menu item to tree view context menu
ngapp.run(function(contextMenuFactory) {
    let menuItems = contextMenuFactory.mainTreeItems,
        automateIndex = menuItems.findIndex((item) => { return item.id === 'Automate'; });
    menuItems.splice(automateIndex + 1, 0, {
        id: 'Manage Patchers',
        visible: () => { return true; },
        build: (scope, items) => {
            items.push({
                label: 'Manage Patchers',
                hotkey: 'Ctrl+P',
                callback: () => openManagePatchersModal(scope)
            });
        }
    });
});

// register settings tab
ngapp.run(function(settingsService) {
    settingsService.registerSettings({
        label: 'Unified Patching Framework',
        templateUrl: `${modulePath}/partials/settings.html`,
        controller: 'upfSettingsController'
    });
});

ngapp.run(function($rootScope, patcherService) {
    $rootScope.$on('filesLoaded', patcherService.loadSettings);
});