ngapp.service('patchBuilder', function($rootScope, $q, patcherService, errorService, backgroundService) {
    let progress, cache = {};

    let getMaxProgress = function(patchPlugin) {
        return patchPlugin.patchers.reduce(function(sum, patcher) {
            let numProcessTasks = 3 * patcher.process.length;
            return sum + 3 + numProcessTasks * patcher.filesToPatch.length;
        });
    };

    let build = function(patchPlugin) {
        return backgroundService.run({
            filename: `${modulePath}/patchWorker.js`,
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

    let wrapPatchers = function(callback, maxProgress) {
        xelib.CreateHandleGroup();
        openProgressModal(maxProgress);
        callback().then(cleanup, function(error) {
            cleanup();
            errorService.handleException(error);
        });
    };

    let getActivePatchPlugins = function(patchPlugins) {
        return patchPlugins.filter(function(patchPlugin) {
            return !patchPlugin.disabled;
        })
    };

    let getTotalMaxProgress = function(patchPlugins) {
        return patchPlugins.reduce(function (sum, patchPlugin) {
            return sum + getMaxProgress(patchPlugin);
        })
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

    // public functions
    this.buildPatchPlugins = function(patchPlugins) {
        let activePatchPlugins = getActivePatchPlugins(patchPlugins),
            maxProgress = getTotalMaxProgress(activePatchPlugins);
        wrapPatchers(function() {
            let action = $q.defer();
            buildNextPatchPlugin(0, activePatchPlugins, action);
            return action.promise;
        }, maxProgress);
    };
});