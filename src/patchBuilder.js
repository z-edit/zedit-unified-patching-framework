ngapp.service('patchBuilder', function($rootScope, $timeout, patcherService, patchPluginWorker, errorService, progressService) {
    let cache = {};

    let build = (patchPlugin) => patchPluginWorker.run(cache, patchPlugin);

    let getExecutor = function(patcher) {
        let helpers = {},
            settings = patcherService.settings[patcher.id],
            locals = {};
        return patcher.execute.constructor === Function
            ? patcher.execute(0, helpers, settings, locals)
            : patcher.execute;
    };

    let getProcessSize = function(process, files) {
        return process.reduce((sum, block) => {
            let patch = block.patch ? 1 : 0;
            if (block.records) return sum + 1 + patch;
            if (block.load) return sum + files.length * (2 + patch);
            return sum;
        }, 0);
    };

    let getMaxProgress = function(patchPlugin) {
        return patchPlugin.patchers.filterOnKey('active')
            .map(p => patcherService.getPatcher(p.id))
            .reduce((sum, patcher) => {
                let {customProgress, process} = getExecutor(patcher),
                    files = patcher.filesToPatch;
                if (customProgress) return sum + customProgress(files);
                return sum + 2 + getProcessSize(process, files);
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
            echo: true,
            title: 'Running Patchers',
            message: 'Initializing...',
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
            patcherService.loadCache();
            let success = errorService.try(() =>
                activePatchPlugins.forEach(build));
            success ? patcherService.saveCache() : patcherService.loadCache();
            progressDone(activePatchPlugins, success);
            cache = {};
            xelib.FreeHandleGroup();
            $rootScope.$broadcast('reloadGUI');
        }, 50);
    };
});