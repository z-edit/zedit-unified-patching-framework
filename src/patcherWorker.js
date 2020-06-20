ngapp.service('patcherWorker', function(patcherService, progressService, idCacheService, interApiService) {
    this.run = function(cache, patchFileName, patchFile, patcherInfo) {
        let filesToPatch, customProgress, patcher, patcherSettings,
            helpers, locals = {};

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
                file[cacheKey] = xelib.GetRecords(file.handle, search, overrides);
            return filterDeletedRecords(getPreviousOverrides(file[cacheKey]));
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
                load(plugin, helpers, patcherSettings, locals) : load;
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
                patch(patchRecord, helpers, patcherSettings, locals);
            });
        };

        let getPatcherHelpers = function() {
            return Object.assign({
                loadRecords: function(search, includeOverrides = false) {
                    return filesToPatch.reduce(function(records, fn) {
                        let a = getRecords(fn, search, includeOverrides);
                        return records.concat(a);
                    }, []);
                },
                copyToPatch: function(rec, asNew = false) {
                    return xelib.CopyElement(rec, patchFile, asNew);
                },
                allSettings: patcherService.settings,
                logMessage: logMessage,
                cacheRecord: idCacheService.cacheRecord(patchFile)
            }, interApiService.getApi('UPF'));
        };

        let loadAndPatch = function(load, patch) {
            filesToPatch.forEach(filename => {
                let recordsToPatch = getRecordsToPatch(load, filename);
                if (patch) patchRecords(load, patch, filename, recordsToPatch);
            });
        };

        let recordsAndPatch = function(records, patch, label = 'records') {
            patcherProgress(`Getting ${label}`);
            let r = records(filesToPatch, helpers, patcherSettings, locals);
            if (!patch) return;
            patcherProgress(`Patching ${r ? r.length : 0} ${label}`);
            r && r.forEach(record => {
                let patchRecord = xelib.CopyElement(record, patchFile, false);
                patch(patchRecord, helpers, patcherSettings, locals);
            });
        };

        let executeBlock = function({init, load, records, label, patch}) {
            if (init) init(patchFile, helpers, patcherSettings, locals);
            if (records) return recordsAndPatch(records, patch, label);
            if (load) loadAndPatch(load, patch);
        };

        let initialize = function(exec) {
            patcherProgress('Initializing...');
            if (!exec.initialize) return;
            exec.initialize(patchFile, helpers, patcherSettings, locals);
        };

        let process = function(exec) {
            if (!exec.process) return;
            exec.process.forEach(executeBlock);
        };

        let finalize = function(exec) {
            patcherProgress('Finalizing...');
            if (!exec.finalize) return;
            exec.finalize(patchFile, helpers, patcherSettings, locals);
        };

        let getExecutor = function() {
            return patcher.execute.constructor === Function ?
                patcher.execute(patchFile, helpers, patcherSettings, locals) :
                patcher.execute;
        };

        let patcherId = patcherInfo.id;
        filesToPatch = patcherInfo.filesToPatch;
        patcher = patcherService.getPatcher(patcherId);
        helpers = getPatcherHelpers();
        patcherSettings = patcherService.settings[patcherId];
        executor = getExecutor();
        customProgress = executor.customProgress;
        if (customProgress)
            Object.assign(helpers, { addProgress, progressMessage });

        initialize(executor);
        process(executor);
        finalize(executor);
    };
});