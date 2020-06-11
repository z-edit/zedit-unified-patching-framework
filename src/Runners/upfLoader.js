module.exports = function({moduleService, ngapp}) {
    moduleService.deferLoader('UPF');

    ngapp.run(function($rootScope, patcherService) {
        let upfLoader = function({module, fh, moduleService}) {
            moduleService.executeModule(module, {
                registerPatcher: patcherService.registerPatcher,
                fh: fh,
                info: module.info,
                patcherUrl: fh.pathToFileUrl(module.path),
                patcherPath: module.path
            });
            moduleService.loadDocs(module.path);
        };

        moduleService.registerLoader('UPF', upfLoader);
    });
};
