ngapp.service('patcherWorker', function(patcherService, progressService) {
    this.run = function(cache, patchFileName, patchFile, patcherInfo) {
        let filesToPatch, patcher, patcherSettings, helpers, locals;

        // helper functions
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
            patcherProgress(`Filtering ${records.length} ${recordsContext}`);
            return filterFn ? records.filter(filterFn) : records;
        };

        let getRecordsToPatch = function(loadFn, filename) {
            let plugin = getFile(filename),
                loadOpts = loadFn(plugin.handle, helpers, patcherSettings, locals);
            if (!loadOpts) {
                addProgress(2);
                return [];
            }
            let signature = loadOpts.signature,
                recordsContext = getRecordsContext(signature, filename),
                records = loadRecords(filename, signature, recordsContext);
            return filterRecords(records, loadOpts.filter, recordsContext);
        };

        let patchRecords = function(patchFn, filename, recordsToPatch) {
            let signature = xelib.Signature(recordsToPatch[0]),
                recordsContext = getRecordsContext(signature, filename);
            patcherProgress(`Patching ${recordsToPatch.length} ${recordsContext}`);
            recordsToPatch.forEach(function(record) {
                let patchRecord = getOrCreatePatchRecord(record);
                patchFn(patchRecord, helpers, patcherSettings, locals);
            });
        };

        let getPatcherHelpers = function() {
            let loadRecords = function(search, includeOverrides = false) {
                return filesToPatch.reduce(function(records, fn) {
                    return records.concat(getRecords(fn, search, includeOverrides));
                }, []);
            };
            return {
                loadRecords: loadRecords,
                allSettings: patcherService.settings,
                logMessage: logMessage
            }
        };

        let executeBlock = function(processBlock) {
            let loadFn = processBlock.load,
                patchFn = processBlock.patch;
            filesToPatch.forEach(function(filename) {
                let recordsToPatch = getRecordsToPatch(loadFn, filename);
                if (recordsToPatch.length === 0) {
                    addProgress(1);
                    return;
                }
                patchRecords(patchFn, filename, recordsToPatch);
            });
        };

        let initialize = function(exec) {
            patcherProgress('Initializing...');
            if (!exec.initialize) return;
            exec.initialize(patchFile, helpers, patcherSettings, locals);
        };

        let process = function(exec) {
            if (!exec.process) return;
            exec.process.forEach(function(processBlock) {
                executeBlock(processBlock);
            });
        };

        let finalize = function(exec) {
            patcherProgress('Finalizing...');
            if (!exec.finalize) return;
            exec.finalize(patchFile, helpers, patcherSettings, locals);
        };

        let patcherId = patcherInfo.id;
        filesToPatch = patcherInfo.filesToPatch;
        patcher = patcherService.getPatcher(patcherId);
        patcherSettings = patcherService.settings[patcherId];
        helpers = getPatcherHelpers();
        locals = {};

        initialize(patcher.execute);
        process(patcher.execute);
        finalize(patcher.execute);
    };
});