ngapp.service('patchBuilder', function($rootScope, $q, patcherService, errorService, backgroundService) {
    let cache = {}, progress;

    let build = function(patchPlugin) {
        return backgroundService.run({
            filename: `modules/unifiedPatchingFramework/patchWorker.js`,
            data: {
                cache: cache,
                patchPlugin: patchPlugin,
                settings: patcherService.settings
            },
            // callback functions are pascal case for clarity
            callbacks: {
                LogMessage: function(message, level) {
                    if (!progress) return;
                    $rootScope.$applyAsync(function() {
                        progress.log.push({ message: message, level: level });
                    });
                },
                ProgressMessage: function(msg) {
                    $rootScope.$applyAsync(() =>  progress.message = msg);
                },
                AddProgress: function(num) {
                    $rootScope.$applyAsync(() =>  progress.current += num);
                },
                ProgressTitle: function(title) {
                    $rootScope.$applyAsync(() =>  progress.title = title);
                },
                SetCache: (_cache) => cache = _cache
            }
        });
    };

    let cleanup = function() {
        cache = {};
        xelib.FreeHandleGroup();
        $rootScope.$broadcast('closeModal');
        $rootScope.$broadcast('fileAdded');
    };

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
        progress = {
            title: 'Running Patchers',
            message: 'Initializing...',
            log: [],
            current: 0,
            max: maxProgress
        };
        $rootScope.$broadcast('openModal', 'progress', { progress: progress });
    };

    let wrapPatchers = function(callback, maxProgress) {
        xelib.CreateHandleGroup();
        openProgressModal(maxProgress);
        callback().then(cleanup, function(error) {
            cleanup();
            errorService.handleException(error);
        });
    };

    let buildNextPatchPlugin = function(index, patchPlugins, action) {
        if (index === patchPlugins.length) {
            action.resolve();
            return;
        }
        build(patchPlugins[index]).then(
            () => buildNextPatchPlugin(index + 1, patchPlugins, action),
            (error) => action.reject(error)
        );
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
        wrapPatchers(function() {
            let action = $q.defer();
            buildNextPatchPlugin(0, activePatchPlugins, action);
            return action.promise;
        }, maxProgress);
    };
});