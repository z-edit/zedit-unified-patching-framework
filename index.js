/* global ngapp, xelib, modulePath, moduleService */
// helper variables and functions
const openManagePatchersModal = function(scope) {
    scope.$emit('openModal', 'managePatchers', {
        basePath: `${modulePath}/partials`
    });
};
//=require src/*.js
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
                hotkey: 'Ctrl+Shift+P',
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
        patcherService.loadSettings();
        $rootScope.$applyAsync(() => managePatchersButton.hidden = false);
    });
});

// register deferred module loader
moduleService.deferLoader('UPF');
ngapp.run(function(patcherService) {
    moduleService.registerLoader('UPF', function(module, fh) {
        let argKeys = ['registerPatcher', 'fh', 'info', 'patcherPath'];
        let fn = new Function(...argKeys, module.code);
        fn(patcherService.registerPatcher, fh, module.info, module.path);
    });
});