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
        return Object.assign({
            patchFileName: 'zPatch.esp',
            ignoredFiles: [],
            enabled: true
        }, defaultSettings);
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

    let buildTabs = function() {
        patchers.forEach((patcher) => {
            if (patcher.settings) tabs.push(patcher.settings);
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
        if (service.getPatcher(patcher.info.id)) return;
        patchers.push(patcher);
    };

    this.updateForGameMode = function(gameMode) {
        patchers = patchers.filter(function(patcher) {
            return patcher.gameModes.includes(gameMode);
        });
    };

    this.loadSettings = function() {
        let profileName = settingsService.currentProfile;
        service.settingsPath = `profiles/${profileName}/patcherSettings.json`;
        let settings = fh.loadJsonFile(service.settingsPath, {});
        service.settings = buildSettings(settings);
        service.saveSettings();
        buildTabs();
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

    this.getFilesToPatch = function(patcher) {
        let patcherSettings = service.settings[patcher.info.id],
            ignored = patcherSettings.ignoredFiles;
        filesToPatch = xelib.GetLoadedFileNames().filter(function(filename) {
            return !filename.endsWith('.Hardcoded.dat');
        });
        if (patcher.getFilesToPatch) patcher.getFilesToPatch(filesToPatch);
        filesToPatch = filesToPatch.subtract(ignored);
        return filesToPatch;
    };

    this.updateFilesToPatch = function() {
        patchers.forEach(function(patcher) {
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