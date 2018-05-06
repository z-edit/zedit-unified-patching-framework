ngapp.service('patchBuilder', function($rootScope, $timeout, patcherService, patchPluginWorker, errorService, progressService) {
    let cache = {};

    let build = (patchPlugin) => patchPluginWorker.run(cache, patchPlugin);

    let getMaxProgress = function(patchPlugin) {
        return patchPlugin.patchers.filterOnKey('active').mapOnKey('id')
            .map(patcherService.getPatcher)
            .reduce(function(sum, patcher) {
                let exec = patcher.execute,
                    files = patcher.filesToPatch;
                if (exec.customProgress) return exec.customProgress(files);
                return sum + 2 + 3 * exec.process.length * files.length;
            }, 1);
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
            let success = errorService.try(() => {
                activePatchPlugins.forEach(build);
            });
            patcherService.saveSettings();
            progressDone(activePatchPlugins, success);
            cache = {};
            xelib.FreeHandleGroup();
            $rootScope.$broadcast('reloadGUI');
        }, 50);
    };
});