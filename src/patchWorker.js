ngapp.service('patchWorker', function(patcherService, progressService) {
    this.run = function(cache, patchPlugin) {
        let patchFileName, patchFile;

        // helper functions
        let progressTitle = (title) => progressService.progressTitle(title);
        let progressMessage = (title) => progressService.progressMessage(title);
        let logMessage = (title) => progressService.logMessage(title);
        let addProgress = (title) => progressService.addProgress(title);

        let patcherProgress = function(message) {
            addProgress(1);
            progressMessage(message);
        };

        let getOrCreatePatchRecord = function(record) {
            return xelib.AddElement(patchFile, xelib.GetHexFormID(record));
        };

        let getFile = function(filename) {
            if (!cache[filename])
                cache[filename] = { handle: xelib.FileByName(filename) };
            return cache[filename];
        };

        let getRecords = function(filename, search, overrides) {
            let file = getFile(filename),
                cacheKey = `${search}_${+overrides}`;
            if (!file[cacheKey])
                file[cacheKey] = xelib.GetRecords(file.handle, search, overrides);
            return file[cacheKey];
        };

        let getRecordsContext = function(signature, filename) {
            let recordType = xelib.NameFromSignature(signature);
            return `${recordType} records from ${filename}`;
        };

        let loadRecords = function(filename, signature, recordsContext) {
            patcherProgress(`Loading ${recordsContext}.`);
            return getRecords(filename, signature, false);
        };

        let filterRecords = function(records, filterFn, recordsContext) {
            patcherProgress(`Filtering ${records.length} ${recordsContext}.`);
            return filterFn ? records.filter(filterFn) : records;
        };

        let getRecordsToPatch = function(loadFn, filename, settings, locals) {
            let plugin = getFile(filename),
                loadOpts = loadFn(plugin.handle, settings, locals);
            if (!loadOpts) {
                AddProgress(2);
                return [];
            }
            let recordsContext = getRecordsContext(loadOpts.signature, filename),
                records = loadRecords(filename, loadOpts.signature, recordsContext);
            return filterRecords(records, loadOpts.filter, recordsContext);
        };

        let patchRecords = function(patchFn, filename, recordsToPatch, settings, locals) {
            let signature = xelib.Signature(recordsToPatch[0]),
                recordsContext = getRecordsContext(signature, filename);
            patcherProgress(`Patching ${recordsToPatch.length} ${recordsContext}.`);
            recordsToPatch.forEach(function(record) {
                let patchRecord = getOrCreatePatchRecord(record);
                patchFn(patchRecord, settings, locals);
            });
        };

        let getPatcherHelpers = function(patcher, filesToPatch) {
            let loadRecords = function(search, includeOverrides = false) {
                return filesToPatch.reduce(function(records, fn) {
                    return records.concat(getRecords(fn, search, includeOverrides));
                }, []);
            };
            return {
                LoadRecords: loadRecords,
                AllSettings: patcherService.settings,
                LogMessage: logMessage
            }
        };

        let executeBlock = function(processBlock, filesToPatch, settings, locals) {
            let loadFn = processBlock.load,
                patchFn = processBlock.patch;
            filesToPatch.forEach(function(filename) {
                let recordsToPatch = getRecordsToPatch(loadFn, filename, settings, locals);
                if (recordsToPatch.length === 0) {
                    addProgress(1);
                    return;
                }
                patchRecords(patchFn, filename, recordsToPatch, settings, locals);
            });
        };

        let preparePatchFile = function(filename) {
            if (!xelib.HasElement(0, filename)) {
                let dataPath = xelib.GetGlobal('DataPath');
                fh.jetpack.cwd(dataPath).remove(filename);
            }
            let patchFile = xelib.AddElement(0, filename);
            xelib.NukeFile(patchFile);
            xelib.AddAllMasters(patchFile);
            return patchFile;
        };

        let initialize = function(exec, helpers, patcherSettings, locals) {
            patcherProgress('Initializing...');
            if (!exec.initialize) return;
            exec.initialize(patchFile, helpers, patcherSettings, locals);
        };

        let process = function(exec, filesToPatch, patcherSettings, locals) {
            exec.process && exec.process.forEach(function(processBlock) {
                executeBlock(processBlock, filesToPatch, patcherSettings, locals);
            });
        };

        let finalize = function(exec, helpers, patcherSettings, locals) {
            patcherProgress('Finalizing...');
            exec.finalize(patchFile, helpers, patcherSettings, locals);
        };

        let executePatcher = function(patcherId, filesToPatch) {
            let patcher = patcherService.getPatcher(patcherId),
                patcherSettings = patcherService.settings[patcherId],
                helpers = getPatcherHelpers(patcher, filesToPatch),
                locals = {};

            initialize(patcher.execute, helpers, patcherSettings, locals);
            process(patcher.execute, filesToPatch, patcherSettings, locals);
            finalize(patcher.execute, helpers, patcherSettings, locals);
        };

        let cleanPatchFile = function(patchFile) {
            LogMessage('Removing ITPOs and cleaning masters.');
            // TODO: uncomment when this is fixed
            //xelib.RemoveIdenticalRecords(patchFile);
            xelib.CleanMasters(patchFile);
        };

        // MAIN WORKER EXECUTION
        patchFileName = patchPlugin.filename;
        patchFile = preparePatchFile(patchFileName);
        patchPlugin.patchers.forEach(function(patcher) {
            if (!patcher.active) return;
            progressTitle(`Building ${patchFileName} ~ Running ${patcher.name}`);
            executePatcher(patcher.id, patcher.filesToPatch);
        });
        cleanPatchFile(patchFile);
    };
});