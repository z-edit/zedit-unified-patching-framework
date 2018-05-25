/* global ngapp, xelib, moduleUrl, moduleService */

// helper variables and functions
const openManagePatchersModal = function(scope) {
    scope.$emit('openModal', 'managePatchers', {
        basePath: `${moduleUrl}/partials`
    });
};

// == begin source files ==
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
        $scope.updatePatchStatuses();
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

ngapp.service('idCacheService', function(patcherService) {
    let prepareIdCache = function(patchFile) {
        let cache = patcherService.settings.cache,
            fileName = xelib.Name(patchFile);
        if (!cache.hasOwnProperty(fileName)) cache[fileName] = {};
        return cache[fileName];
    };

    let updateNextFormId = function(patchFile, idCache) {
        let formIds = Object.values(idCache),
            maxFormId = formIds.reduce((a, b) => Math.max(a, b), 0x7FF);
        xelib.SetNextObjectID(patchFile, maxFormId + 1);
    };

    this.cacheRecord = function(patchFile) {
        let idCache = prepareIdCache(patchFile),
            usedIds = {};

        updateNextFormId(patchFile, idCache);

        return function(rec, id) {
            if (!xelib.IsMaster(rec)) return;
            if (usedIds.hasOwnProperty(id))
                throw new Error(`cacheRecord: ${id} is not unique.`);
            if (idCache.hasOwnProperty(id)) {
                xelib.SetFormID(rec, idCache[id], true, false);
            } else {
                idCache[id] = xelib.GetFormID(rec, true);
            }
            if (xelib.HasElement(rec, 'EDID')) xelib.SetValue(rec, 'EDID', id);
            usedIds[id] = true;
            return rec;
        };
    };
});
ngapp.directive('ignorePlugins', function() {
    return {
        restrict: 'E',
        scope: {
            patcherId: '@'
        },
        templateUrl: `${moduleUrl}/partials/ignorePlugins.html`,
        controller: 'ignorePluginsController'
    }
});

ngapp.controller('ignorePluginsController', function($scope, patcherService) {
    // helper functions
    let updateIgnoredFiles = function() {
        let settings = patcherService.settings[$scope.patcherId];
        settings.ignoredFiles = $scope.ignoredPlugins
            .filter((item) => !item.invalid)
            .map((item) => item.filename);
    };

    let getValid = function(item, itemIndex) {
        let filename = item.filename,
            isRequired = $scope.requiredPlugins.includes(filename),
            duplicate = $scope.ignoredPlugins.find((item, index) => {
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
    if (!$scope.patcherId)
        throw 'ignorePlugins Directive: patcher-id is required.';

    let patcher = patcherService.getPatcher($scope.patcherId),
        ignored = patcherService.getIgnoredFiles(patcher);

    $scope.requiredPlugins = patcherService.getRequiredFiles(patcher);
    $scope.ignoredPlugins = ignored.map(filename => ({filename: filename}));
});
ngapp.controller('managePatchersModalController', function($scope, patcherService) {
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
    $scope.noPatchers = $scope.tabs.length === 1;
    selectTab($scope.tabs[0]);

    // scope functions
    $scope.buildAllPatches = () => $scope.$broadcast('buildAllPatches');
    $scope.addPatchPlugin = () => $scope.$broadcast('addPatchPlugin');

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
ngapp.service('patchBuilder', function($rootScope, $timeout, patcherService, patchPluginWorker, errorService, progressService) {
    let cache = {};

    let build = (patchPlugin) => patchPluginWorker.run(cache, patchPlugin);

    let getExecutor = function(patcher) {
        return patcher.execute.constructor === Function ?
            patcher.execute(0, {}, {}, {}) : patcher.execute;
    };

    let getMaxProgress = function(patchPlugin) {
        return patchPlugin.patchers.filterOnKey('active').mapOnKey('id')
            .map(patcherService.getPatcher)
            .reduce((sum, patcher) => {
                let exec = getExecutor(patcher),
                    files = patcher.filesToPatch;
                if (exec.customProgress) return exec.customProgress(files);
                return sum + 2 + 3 * exec.process.length * files.length;
            }, 1);
    };

    let getTotalMaxProgress = function(patchPlugins) {
        return patchPlugins.reduce((sum, patchPlugin) => {
            return sum + getMaxProgress(patchPlugin);
        }, 0);
    };

    let openProgressModal = function(maxProgress) {
        $rootScope.$broadcast('closeModal');
        progressService.showProgress({
            determinate: true,
            title: 'Running Patchers',
            message: 'Initializing...',
            log: [],
            current: 0,
            max: maxProgress
        });
    };

    let getActivePatchPlugins = function(patchPlugins) {
        return patchPlugins.filter(patchPlugin => !patchPlugin.disabled);
    };

    let progressDone = function(patchPlugins, success) {
        let pluginsStr = `${patchPlugins.length} patch plugins`;
        progressService.progressTitle(success ?
            `${pluginsStr} built successfully` :
            `${pluginsStr} failed to build`);
        progressService.progressMessage(success ? 'All Done!' : 'Error');
        progressService.allowClose();
    };

    // public functions
    this.buildPatchPlugins = function(patchPlugins) {
        let activePatchPlugins = getActivePatchPlugins(patchPlugins),
            maxProgress = getTotalMaxProgress(activePatchPlugins);
        if (activePatchPlugins.length === 0) return;
        xelib.CreateHandleGroup();
        openProgressModal(maxProgress);
        $timeout(function() {
            let success = errorService.try(() =>
                activePatchPlugins.forEach(build));
            patcherService.saveSettings();
            progressDone(activePatchPlugins, success);
            cache = {};
            xelib.FreeHandleGroup();
            $rootScope.$broadcast('reloadGUI');
        }, 50);
    };
});
ngapp.service('patcherService', function($rootScope, settingsService) {
    const disabledHintBase =
        'This patcher is disabled because the following required' +
        '\r\nfiles are not available to the patch plugin:';

    let service = this,
        patchers = [],
        tabs = [{
            label: 'Build Patches',
            templateUrl: `${moduleUrl}/partials/buildPatches.html`,
            controller: 'buildPatchesController'
        }];

    // private functions
    let getAvailableFiles = function(patcher) {
        let patchFileName = service.settings[patcher.info.id].patchFileName;
        return xelib.GetLoadedFileNames().itemsBefore(patchFileName);
    };

    let getPatcherEnabled = function(patcher) {
        return service.settings[patcher.info.id].enabled;
    };

    let getMissingRequirements = function(patcher) {
        return service.getRequiredFiles(patcher)
            .subtract(patcher.availableFiles);
    };

    let getPatcherDisabled = function(patcher) {
        return getMissingRequirements(patcher).length > 0;
    };

    let getDisabledHint = function(patcher) {
        return getMissingRequirements(patcher).reduce((hint, filename) => {
            return `${hint}\r\n - ${filename}`;
        }, disabledHintBase);
    };

    let getDefaultSettings = function(patcher) {
        let defaultSettings = patcher.settings.defaultSettings || {};
        return Object.assign({
            patchFileName: 'zPatch.esp',
            ignoredFiles: [],
            enabled: true
        }, defaultSettings);
    };

    let buildSettings = function(settings) {
        let defaults = { cache: {} };
        patchers.forEach(function(patcher) {
            let patcherSettings = {};
            patcherSettings[patcher.info.id] = getDefaultSettings(patcher);
            Object.deepAssign(defaults, patcherSettings);
        });
        return Object.deepAssign(defaults, settings);
    };

    let buildTabs = function() {
        patchers.forEach(function(patcher) {
            if (!patcher.settings.hide) tabs.push(patcher.settings);
        });
    };

    let getFilesToPatchHint = function(patcher) {
        let filesToPatch = patcher.filesToPatch,
            hint = filesToPatch.slice(0, 40).join(', ');
        if (filesToPatch.length > 40) hint += '...';
        return hint.wordwrap();
    };

    let createPatchPlugin = function(patchPlugins, patchFileName) {
        let patchPlugin = { filename: patchFileName, patchers: [] };
        patchPlugins.push(patchPlugin);
        return patchPlugin;
    };

    let getPatchPlugin = function(patcher, patchPlugins) {
        let patchFileName = service.settings[patcher.info.id].patchFileName;
        return patchPlugins.find(patchPlugin => {
            return patchPlugin.filename === patchFileName;
        }) || createPatchPlugin(patchPlugins, patchFileName);
    };

    // public functions
    this.getPatcher = function(id) {
        return patchers.find(patcher => patcher.info.id === id);
    };

    this.registerPatcher = function(patcher) {
        if (service.getPatcher(patcher.info.id)) return;
        patchers.push(patcher);
    };

    this.updateForGameMode = function(gameMode) {
        patchers = patchers.filter(patcher => {
            return patcher.gameModes.includes(gameMode);
        });
    };

    this.loadSettings = function() {
        let profileName = settingsService.currentProfile;
        service.settingsPath = `profiles/${profileName}/patcherSettings.json`;
        let settings = fh.loadJsonFile(service.settingsPath) || {};
        service.settings = buildSettings(settings);
        service.saveSettings();
        buildTabs();
    };

    this.saveSettings = function() {
        fh.saveJsonFile(service.settingsPath, service.settings);
    };

    this.getTabs = function() {
        return tabs.map(tab => ({
            label: tab.label,
            templateUrl: tab.templateUrl,
            controller: tab.controller
        }));
    };

    this.getRequiredFiles = function(patcher) {
        if (!patcher.requiredFiles) return [];
        if (patcher.requiredFiles.constructor === Function)
            return patcher.requiredFiles() || [];
        return patcher.requiredFiles;
    };

    this.getIgnoredFiles = function(patcher) {
        return service.settings[patcher.info.id].ignoredFiles;
    };

    this.getFilesToPatch = function(patcher) {
        let filesToPatch = patcher.availableFiles.slice();
        if (patcher.getFilesToPatch)
            filesToPatch = patcher.getFilesToPatch(filesToPatch);
        return filesToPatch.subtract(service.getIgnoredFiles(patcher));
    };

    this.updateFilesToPatch = function() {
        patchers.forEach(function(patcher) {
            patcher.availableFiles = getAvailableFiles(patcher);
            patcher.filesToPatch = service.getFilesToPatch(patcher);
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
ngapp.service('patcherWorker', function(patcherService, progressService, idCacheService, interApiService) {
    this.run = function(cache, patchFileName, patchFile, patcherInfo) {
        let filesToPatch, customProgress, patcher, patcherSettings,
            helpers, locals = {};

        // helper functions
        let progressMessage = (title) => progressService.progressMessage(title);
        let logMessage = (msg) => progressService.logMessage(msg);
        let addProgress = (num) => progressService.addProgress(num);

        let patcherProgress = function(message) {
            if (!customProgress) addProgress(1);
            progressMessage(message);
        };

        let getFile = function(filename) {
            if (!cache[filename])
                cache[filename] = { handle: xelib.FileByName(filename) };
            return cache[filename];
        };

        let filterDeletedRecords = function(records) {
            if (patcherSettings.processDeletedRecords) return records;
            return records.filter(function(record) {
                return !xelib.GetRecordFlag(record, 'Deleted');
            });
        };

        let getPreviousOverrides = function(records) {
            return records.map(function(record) {
                return xelib.GetPreviousOverride(record, patchFile);
            });
        };

        let getRecords = function(filename, search, overrides) {
            let file = getFile(filename),
                cacheKey = `${search}_${+overrides}`;
            if (!file[cacheKey])
                file[cacheKey] = filterDeletedRecords(getPreviousOverrides(
                    xelib.GetRecords(file.handle, search, overrides)
                ));
            return file[cacheKey];
        };

        let getRecordsContext = function({signature, overrides}, filename) {
            let recordType = xelib.NameFromSignature(signature);
            if (overrides) recordType = `${recordType} override`;
            return `${recordType} records from ${filename}`;
        };

        let loadRecords = function(filename, {signature, overrides}, recordsContext) {
            patcherProgress(`Loading ${recordsContext}.`);
            return getRecords(filename, signature, overrides);
        };

        let filterRecords = function(records, filterFn, recordsContext) {
            patcherProgress(`Filtering ${records.length} ${recordsContext}`);
            return filterFn ? records.filter(filterFn) : records;
        };

        let getLoadOpts = function(load, plugin) {
            return load.constructor === Function ?
                load(plugin, helpers, patcherSettings, locals) : load;
        };

        let getRecordsToPatch = function(load, filename) {
            let loadOpts = getLoadOpts(load, getFile(filename));
            if (!loadOpts || !loadOpts.signature) {
                if (!customProgress) addProgress(2);
                return [];
            }
            let recordsContext = getRecordsContext(loadOpts, filename),
                records = loadRecords(filename, loadOpts, recordsContext);
            return filterRecords(records, loadOpts.filter, recordsContext);
        };

        let patchRecords = function(load, patch, filename, recordsToPatch) {
            let loadOpts = getLoadOpts(load, getFile(filename)),
                recordsContext = getRecordsContext(loadOpts, filename);
            patcherProgress(`Patching ${recordsToPatch.length} ${recordsContext}`);
            recordsToPatch.forEach(function(record) {
                let patchRecord = xelib.CopyElement(record, patchFile, false);
                patch(patchRecord, helpers, patcherSettings, locals);
            });
        };

        let getPatcherHelpers = function() {
            return Object.assign({
                loadRecords: function(search, includeOverrides = false) {
                    return filesToPatch.reduce(function(records, fn) {
                        let a = getRecords(fn, search, includeOverrides);
                        return records.concat(a);
                    }, []);
                },
                allSettings: patcherService.settings,
                logMessage: logMessage,
                cacheRecord: idCacheService.cacheRecord(patchFile)
            }, interApiService.getApi('UPF'));
        };

        let executeBlock = function({load, patch}) {
            if (!load) return;
            filesToPatch.forEach(filename => {
                let recordsToPatch = getRecordsToPatch(load, filename);
                if (patch && recordsToPatch.length > 0)
                    return patchRecords(load, patch, filename, recordsToPatch);
                if (!customProgress) addProgress(1);
            });
        };

        let initialize = function(exec) {
            patcherProgress('Initializing...');
            if (!exec.initialize) return;
            exec.initialize(patchFile, helpers, patcherSettings, locals);
        };

        let process = function(exec) {
            if (!exec.process) return;
            exec.process.forEach(function(processBlock) {
                executeBlock(processBlock);
            });
        };

        let finalize = function(exec) {
            patcherProgress('Finalizing...');
            if (!exec.finalize) return;
            exec.finalize(patchFile, helpers, patcherSettings, locals);
        };

        let getExecutor = function() {
            return patcher.execute.constructor === Function ?
                patcher.execute(patchFile, helpers, patcherSettings, locals) :
                patcher.execute;
        };

        let patcherId = patcherInfo.id;
        filesToPatch = patcherInfo.filesToPatch;
        patcher = patcherService.getPatcher(patcherId);
        helpers = getPatcherHelpers();
        patcherSettings = patcherService.settings[patcherId];
        executor = getExecutor();
        customProgress = executor.customProgress;
        if (customProgress) helpers.addProgress = addProgress;

        initialize(executor);
        process(executor);
        finalize(executor);
    };
});
ngapp.service('patchPluginWorker', function(progressService, patcherWorker) {
    this.run = function(cache, patchPlugin) {
        let start = new Date();

        let progressTitle = function(title) {
            progressService.progressTitle(title);
        };

        let patcherProgress = function(message) {
            progressService.addProgress(1);
            progressService.progressMessage(message);
        };

        let preparePatchFile = function(filename) {
            if (!xelib.HasElement(0, filename)) {
                let dataPath = xelib.GetGlobal('DataPath');
                fh.jetpack.cwd(dataPath).remove(filename);
            }
            let patchFile = xelib.AddElement(0, filename);
            xelib.NukeFile(patchFile);
            xelib.AddAllMasters(patchFile);
            return patchFile;
        };

        let cleanPatchFile = function(patchFile) {
            patcherProgress('Removing ITPOs and cleaning masters.');
            try {
                xelib.RemoveIdenticalRecords(patchFile, false, true);
            } catch (x) {
                progressService.logMessage('Removing ITPOs failed: ' + x.message);
            }
            xelib.CleanMasters(patchFile);
        };

        // MAIN WORKER EXECUTION
        let patchFileName = patchPlugin.filename,
            patchFile = preparePatchFile(patchFileName);
        patchPlugin.patchers.forEach(function(patcher) {
            if (!patcher.active) return;
            progressTitle(`Building ${patchFileName} ~ Running ${patcher.name}`);
            patcherWorker.run(cache, patchFileName, patchFile, patcher);
        });
        cleanPatchFile(patchFile);
        console.log(`Generated ${patchFileName} in ${new Date() - start}ms`);
    };
});
ngapp.controller('upfSettingsController', function($timeout, $scope) {
    $scope.bannerStyle = {
        'background': `url('${moduleUrl}/images/banner.jpg')`,
        'background-size': 'cover'
    };

    $scope.managePatchers = function() {
        $scope.saveSettings(false);
        $timeout(() => openManagePatchersModal($scope));
    };
});
// == end source files ==

moduleService.deferLoader('UPF');
ngapp.run(function($rootScope, patcherService, contextMenuFactory, settingsService, hotkeyFactory, buttonFactory) {
    // add manage patchers context menu item to tree view context menu
    let menuItems = contextMenuFactory.treeViewItems,
        automateIndex = menuItems.findIndex(item => {
            return item.id === 'Automate';
        });
    menuItems.splice(automateIndex + 1, 0, {
        id: 'Manage Patchers',
        visible: () => true,
        build: (scope, items) => {
            items.push({
                label: 'Manage Patchers',
                hotkey: 'Ctrl+Shift+P',
                callback: () => openManagePatchersModal(scope)
            });
        }
    });

    // register settings tab
    settingsService.registerSettings({
        appModes: ['edit'],
        label: 'Unified Patching Framework',
        templateUrl: `${moduleUrl}/partials/settings.html`,
        controller: 'upfSettingsController'
    });

    // register hotkey
    hotkeyFactory.addHotkeys('editView', {
        p: [{
            modifiers: ['ctrlKey', 'shiftKey'],
            callback: openManagePatchersModal
        }]
    });

    // register button
    let managePatchersButton = {
        class: 'fa fa-puzzle-piece',
        title: 'Manage Patchers',
        hidden: true,
        onClick: openManagePatchersModal
    };
    buttonFactory.buttons.unshift(managePatchersButton);

    // register for events
    $rootScope.$on('sessionStarted', function(e, selectedProfile) {
        patcherService.updateForGameMode(selectedProfile.gameMode);
    });

    $rootScope.$on('filesLoaded', function() {
        if ($rootScope.appMode !== 'edit') return;
        patcherService.loadSettings();
        $rootScope.$applyAsync(() => managePatchersButton.hidden = false);
    });

    // register deferred module loader
    let upfLoader = function({module, fh, moduleService}) {
        Function.execute({
            registerPatcher: patcherService.registerPatcher,
            fh: fh,
            info: module.info,
            patcherUrl: fh.pathToFileUrl(module.path),
            patcherPath: module.path
        }, module.code, module.info.id);
        moduleService.loadDocs(module.path);
    };

    moduleService.registerLoader('UPF', upfLoader);
});