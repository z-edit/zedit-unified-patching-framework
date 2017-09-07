/* global ngapp */
// helper variables and functions
let modulePath = '../modules/unifiedPatchingFramework';
let openManagePatchersModal = function(scope) {
  scope.$emit('openModal', 'managePatchers', {
    templateUrl: `${modulePath}/partials/managePatchersModal.html`
  });
};

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
ngapp.service('patcherService', function(settingsService) {
    let service = this,
        patchers = [],
        tabs = [{
            label: 'Build Patches',
            templateUrl: `${modulePath}/partials/buildPatches.html`
        }],
        cache = {};

    // helper functions
    let getPatcherEnabled = function(patcherId) {
        let settings = service.settings[patcherId];
        return settings && settings.hasOwnProperty('enabled') ? settings.enabled : true;
    };

    let getPatcher = function(id) {
        return patchers.find((patcher) => { return patcher.info.id === id; });
    };

    let getOrCreatePatchPlugin = (fileName) => { return xelib.AddElement(0, fileName) };

    let getOrCreatePatchRecord = function(patchPlugin, record) {
        return xelib.AddElement(patchPlugin, xelib.HexFormID(record));
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
        let patcherSettings = service.settings[patcher.info.id];
        return {
            LoadRecords: function(search, includeOverrides = false) {
                return patcherSettings.filesToPatch.reduce(function(records, filename) {
                    return records.concat(getRecords(filename, search, includeOverrides));
                }, []);
            },
            AllSettings: service.settings
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

    let executeProcessBlock = function(processBlock, patchPlugin, settings, locals) {
        let load = processBlock.load,
            patch = processBlock.patch;
        settings.filesToPatch.forEach(function(filename) {
            let recordsToPatch = getRecordsToPatch(load, filename, settings, locals);
            if (recordsToPatch.length === 0) return;
            addRequiredMastersToPatch(filename, patchPlugin);
            recordsToPatch.forEach(function(record) {
                let patchRecord = getOrCreatePatchRecord(patchPlugin, record);
                patch(patchRecord, settings, locals);
            });
        });
    };

    let getBaseDefaults = function(patcher) {
        let baseDefaults = {};
        baseDefaults[patcher.info.id] = { patchFileName: 'zPatch.esp' };
        return baseDefaults;
    };

    let getFilesToPatch = function(patcher) {
        if (patcher.getDefaultFilesToPatch) {
            return patcher.getDefaultFilesToPatch();
        } else {
            let defaultFilesToPatch = xelib.GetLoadedFileNames();
            defaultFilesToPatch.remove('Skyrim.Hardcoded.dat');
            return defaultFilesToPatch;
        }
    };

    let getDefaultSettings = function(patcher) {
        let defaultSettings = patcher.settings.defaultSettings || {};
        Object.deepAssign(defaultSettings, getBaseDefaults(patcher));
        return defaultSettings;
    };

    let buildSettings = function(settings) {
        let defaults = {};
        patchers.forEach(function(patcher) {
            Object.deepAssign(defaults, getDefaultSettings(patcher));
        });
        return Object.deepAssign(defaults, settings);
    };

    let getFilesToPatchHint = function(filesToPatch) {
        let hint = filesToPatch.slice(0, 40).join(', ');
        if (filesToPatch.length > 40) hint += '...';
        return hint.wordwrap();
    };

    let updateFilesToPatch = function() {
        patchers.forEach(function(patcher) {
            let patcherSettings = service.settings[patcher.info.id];
            patcherSettings.filesToPatch = getFilesToPatch(patcher);
        });
    };

    // service functions
    this.hasPatcher = (id) => { return !!getPatcher(id) };

    this.registerPatcher = function(patcher) {
        if (service.hasPatcher(patcher.info.id)) return;
        patchers.push(patcher);
        if (!patcher.settings) return;
        tabs.push(patcher.settings);
    };

    this.loadSettings = function() {
        let profileName = settingsService.currentProfile;
        service.settingsPath = `profiles/${profileName}/patcherSettings.json`;
        let settings = fh.loadJsonFile(service.settingsPath, {});
        service.settings = buildSettings(settings);
        updateFilesToPatch();
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

    this.getPatchPlugins = function() {
        let patchPlugins = [];
        patchers.forEach(function(patcher) {
            let patcherSettings = service.settings[patcher.info.id],
                patchPlugin = patchPlugins.find(function(patchPlugin) {
                    return patchPlugin.filename === patcherSettings.patchFileName;
                });
            if (!patchPlugin) {
                patchPlugin = { filename: patcherSettings.patchFileName, patchers: [] };
                patchPlugins.push(patchPlugin);
            }
            patchPlugin.patchers.push({
                id: patcher.info.id,
                name: patcher.info.name,
                active: getPatcherEnabled(patcher.info.id),
                filesToPatch: patcherSettings.filesToPatch,
                filesToPatchHint: getFilesToPatchHint(patcherSettings.filesToPatch)
            });
        });
        return patchPlugins;
    };

    this.executePatcher = function(scope, patcherId) {
        let patcher = getPatcher(patcherId),
            exec = patcher.execute,
            settings = service.settings[patcherId],
            patchPlugin = getOrCreatePatchPlugin(settings.patchFileName),
            helpers = getPatcherHelpers(patcher),
            locals = {};

        exec.initialize && exec.initialize(patchPlugin, helpers, settings, locals);
        exec.process && exec.process.forEach(function(processBlock) {
            executeProcessBlock(processBlock, patchPlugin, settings, locals);
        });
        exec.finalize && exec.finalize(patchPlugin, helpers, settings, locals);
    };

    this.clearCache = () => cache = {};
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

// prepare init function for after all modules have been loaded
ngapp.run(function(initService, patcherService) {
    initService.add('afterLoad', patcherService.loadSettings);
});