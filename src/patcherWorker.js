ngapp.service('patcherWorker', function(patcherService, progressService, idCacheService) {
    this.run = function(cache, patchFileName, patchFile, patcherInfo) {
        let filesToPatch, customProgress, patcher, patcherSettings,
            helpers, locals;

        // helper functions
        let progressMessage = (title) => progressService.progressMessage(title);
        let logMessage = (msg) => progressService.logMessage(msg);
        let addProgress = (num) => progressService.addProgress(num);

        let patcherProgress = function(message) {
            if (!customProgress) addProgress(1);
            progressMessage(message);
        };

        let getFile = function(filename) {
            if (!cache[filename])
                cache[filename] = { handle: xelib.FileByName(filename) };
            return cache[filename];
        };

        let filterDeletedRecords = function(records) {
            if (patcherSettings.processDeletedRecords) return records;
            return records.filter(function(record) {
                return !xelib.GetRecordFlag(record, 'Deleted');
            });
        };

        let getPreviousOverrides = function(records) {
            return records.map(function(record) {
                return xelib.GetPreviousOverride(record, patchFile);
            });
        };

        let getRecords = function(filename, search, overrides) {
            let file = getFile(filename),
                cacheKey = `${search}_${+overrides}`;
            if (!file[cacheKey])
                file[cacheKey] = filterDeletedRecords(getPreviousOverrides(
                    xelib.GetRecords(file.handle, search, overrides)
                ));
            return file[cacheKey];
        };

        let getRecordsContext = function({signature, overrides}, filename) {
            let recordType = xelib.NameFromSignature(signature);
            if (overrides) recordType = `${recordType} override`;
            return `${recordType} records from ${filename}`;
        };

        let loadRecords = function(filename, {signature, overrides}, recordsContext) {
            patcherProgress(`Loading ${recordsContext}.`);
            return getRecords(filename, signature, overrides);
        };

        let filterRecords = function(records, filterFn, recordsContext) {
            patcherProgress(`Filtering ${records.length} ${recordsContext}`);
            return filterFn ? records.filter(filterFn) : records;
        };

        let getLoadOpts = function(load, plugin) {
            return load.constructor === Function ?
                load(plugin, helpers, settings, locals) : load;
        };

        let getRecordsToPatch = function(load, filename) {
            let loadOpts = getLoadOpts(load, getFile(filename));
            if (!loadOpts || !loadOpts.signature) {
                if (!customProgress) addProgress(2);
                return [];
            }
            let recordsContext = getRecordsContext(loadOpts, filename),
                records = loadRecords(filename, loadOpts, recordsContext);
            return filterRecords(records, loadOpts.filter, recordsContext);
        };

        let patchRecords = function(load, patch, filename, recordsToPatch) {
            let loadOpts = getLoadOpts(load, getFile(filename)),
                recordsContext = getRecordsContext(loadOpts, filename);
            patcherProgress(`Patching ${recordsToPatch.length} ${recordsContext}`);
            recordsToPatch.forEach(function(record) {
                let patchRecord = xelib.CopyElement(record, patchFile, false);
                patchFn(patchRecord, helpers, patcherSettings, locals);
            });
        };

        let getPatcherHelpers = function() {
            return {
                loadRecords: function(search, includeOverrides = false) {
                    return filesToPatch.reduce(function(records, fn) {
                        let a = getRecords(fn, search, includeOverrides);
                        return records.concat(a);
                    }, []);
                },
                allSettings: patcherService.settings,
                logMessage: logMessage,
                cacheRecord: idCacheService.cacheRecord(patchFile)
            };
        };

        let executeBlock = function({load, patch}) {
            if (!load) return;
            filesToPatch.forEach(filename => {
                let recordsToPatch = getRecordsToPatch(load, filename);
                if (patch && recordsToPatch.length > 0)
                    return patchRecords(load, patch, filename, recordsToPatch);
                if (!customProgress) addProgress(1);
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
        customProgress = patcher.execute.customProgress;
        patcherSettings = patcherService.settings[patcherId];
        helpers = getPatcherHelpers();
        if (customProgress) helpers.addProgress = addProgress;
        locals = {};

        initialize(patcher.execute);
        process(patcher.execute);
        finalize(patcher.execute);
    };
});