/* global ngapp, xelib, moduleUrl, moduleService */

// helper variables and functions
const openManagePatchersModal = function(scope) {
    scope.$emit('openModal', 'managePatchers', {
        basePath: `${moduleUrl}/partials`
    });
};

// == begin source files ==
//=require src/*.js
// == end source files ==

// add manage patchers context menu item to tree view context menu
ngapp.run(function(contextMenuFactory) {
    let menuItems = contextMenuFactory.treeViewItems,
        automateIndex = menuItems.findIndex((item) => { return item.id === 'Automate'; });
    menuItems.splice(automateIndex + 1, 0, {
        id: 'Manage Patchers',
        visible: () => { return true; },
        build: (scope, items) => {
            items.push({
                label: 'Manage Patchers',
                hotkey: 'Ctrl+Shift+P',
                callback: () => openManagePatchersModal(scope)
            });
        }
    });
});

// register settings tab
ngapp.run(function(settingsService) {
    settingsService.registerSettings({
        appModes: ['edit'],
        label: 'Unified Patching Framework',
        templateUrl: `${moduleUrl}/partials/settings.html`,
        controller: 'upfSettingsController'
    });
});

// register hotkey
ngapp.run(function(hotkeyFactory) {
    hotkeyFactory.addHotkeys('editView', {
        p: [{
            modifiers: ['ctrlKey', 'shiftKey'],
            callback: openManagePatchersModal
        }]
    });
});

// register button
let managePatchersButton = {
    class: 'fa fa-puzzle-piece',
    title: 'Manage Patchers',
    hidden: true,
    onClick: (scope) => openManagePatchersModal(scope)
};
ngapp.run(function(buttonFactory) {
    buttonFactory.buttons.unshift(managePatchersButton);
});

// register for events
ngapp.run(function($rootScope, patcherService) {
    $rootScope.$on('sessionStarted', function(e, selectedProfile) {
        patcherService.updateForGameMode(selectedProfile.gameMode);
    });

    $rootScope.$on('filesLoaded', function() {
        if ($rootScope.appMode !== 'edit') return;
        patcherService.loadSettings();
        $rootScope.$applyAsync(() => managePatchersButton.hidden = false);
    });
});

// register deferred module loader
moduleService.deferLoader('UPF');
ngapp.run(function(patcherService) {
    moduleService.registerLoader('UPF', function({module, fh}) {
        Function.execute({
            registerPatcher: patcherService.registerPatcher,
            fh: fh,
            info: module.info,
            patcherUrl: fh.pathToFileUrl(module.path),
            patcherPath: module.path
        }, module.code, module.info.id);
    });
});