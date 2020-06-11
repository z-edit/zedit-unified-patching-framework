module.exports = function({ngapp, moduleUrl}) {
    ngapp.run(function(settingsService) {
        settingsService.registerSettings({
            appModes: ['edit'],
            label: 'Unified Patching Framework',
            templateUrl: `${moduleUrl}/partials/settings.html`,
            controller: 'upfSettingsController'
        });
    });
};
