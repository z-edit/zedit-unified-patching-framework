module.exports = function({moduleService, ngapp}) {
    moduleService.deferLoader('UPF');

    ngapp.run(function($rootScope, patcherService) {
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
};
