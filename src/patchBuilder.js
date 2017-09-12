ngapp.service('patchBuilder', function($rootScope, $timeout, patcherService, patchWorker, errorService, progressService) {
    let cache = {};

    let build = (patchPlugin) => patchWorker.run(cache, patchPlugin);

    let getMaxProgress = function(patchPlugin) {
        return patchPlugin.patchers.map(function(patcher) {
            return patcherService.getPatcher(patcher.id);
        }).reduce(function(sum, patcher) {
            let numProcessTasks = 3 * patcher.execute.process.length;
            return sum + 3 + numProcessTasks * patcher.filesToPatch.length;
        }, 0);
    };

    let getTotalMaxProgress = function(patchPlugins) {
        return patchPlugins.reduce(function(sum, patchPlugin) {
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
        return patchPlugins.filter(function(patchPlugin) {
            return !patchPlugin.disabled;
        })
    };

    // public functions
    this.buildPatchPlugins = function(patchPlugins) {
        let activePatchPlugins = getActivePatchPlugins(patchPlugins),
            maxProgress = getTotalMaxProgress(activePatchPlugins);
        if (activePatchPlugins.length === 0) return;
        xelib.CreateHandleGroup();
        openProgressModal(maxProgress);
        $timeout(function() {
            errorService.try(() => activePatchPlugins.forEach(build));
            cache = {};
            xelib.FreeHandleGroup();
            $rootScope.$broadcast('fileAdded');
        }, 50);
    };
});