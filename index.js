/* global ngapp, xelib, moduleUrl, moduleService */
let openManagePatchersModal = function(scope) {
    scope.$emit('openModal', 'managePatchers', {
        basePath: `${moduleUrl}/partials`
    });
};

// == begin source files ==
//=require src/*.js
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
        }],
        f5: [{
            modifiers: ['altKey'],
            callback: scope => {
                if (scope.$root.modalActive) return;
                scope.$emit('reloadPatchers')
            }
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
        if (moduleService.hasOwnProperty('loadDocs'))
            moduleService.loadDocs(module.path);
    };

    moduleService.registerLoader('UPF', upfLoader);
});