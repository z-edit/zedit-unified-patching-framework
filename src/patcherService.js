ngapp.service('patcherService', function($rootScope, settingsService) {
    const disabledHintBase =
        'This patcher is disabled because the following required' +
        '\r\nfiles are not available to the patch plugin:';

    let service = this,
        patchers = [],
        tabs = [{
            label: 'Build Patches',
            templateUrl: `${modulePath}/partials/buildPatches.html`,
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