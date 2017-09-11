// helper variables
let cache, patchPlugin, patchers, settings, patchFileName, patchFile;

// helper functions
let patcherProgress = function(message) {
    AddProgress(1);
    ProgressMessage(message);
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
        AllSettings: settings,
        LogMessage: LogMessage
    }
};

let process = function(processBlock, filesToPatch, settings, locals) {
    let loadFn = processBlock.load,
        patchFn = processBlock.patch;
    filesToPatch.forEach(function(filename) {
        let recordsToPatch = getRecordsToPatch(loadFn, filename, settings, locals);
        if (recordsToPatch.length === 0) {
            AddProgress(1);
            return;
        }
        patchRecords(patchFn, filename, recordsToPatch, settings, locals);
    });
};

let getPatcher = function(patcherId) {
    let modulePath = `modules\\${patcherId}`,
        moduleInfo = fh.loadJsonFile(`${modulePath}\\module.json`, null),
        patcherCode = fh.loadTextFile(`${modulePath}\\index.js`),
        patcher = null;
    let fn = new Function('registerPatcher', 'fh', 'info', patcherCode);
    fn((obj) => patcher = obj, fh, moduleInfo);
    return patcher;
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

let executePatcher = function(patcherId, filesToPatch) {
    let patcher = getPatcher(patcherId),
        patcherSettings = settings[patcherId],
        exec = patcher.execute,
        helpers = getPatcherHelpers(patcher, filesToPatch),
        locals = {};

    patcherProgress('Initializing...');
    exec.initialize && exec.initialize(patchFile, helpers, patcherSettings, locals);
    exec.process && exec.process.forEach(function(processBlock) {
        process(processBlock, filesToPatch, patcherSettings, locals);
    });
    patcherProgress('Finalizing...');
    exec.finalize && exec.finalize(patchFile, helpers, patcherSettings, locals);
};

let cleanPatchFile = function(patchFile) {
    LogMessage('Removing ITPOs and cleaning masters.');
    // TODO: uncomment when this is fixed
    //xelib.RemoveIdenticalRecords(patchFile);
    xelib.CleanMasters(patchFile);
};

// MAIN WORKER EXECUTION
({ cache, patchPlugin, settings } = data);
patchFileName = patchPlugin.filename;
patchFile = preparePatchFile(patchFileName);
patchPlugin.patchers.forEach(function(patcher) {
    if (!patcher.active) return;
    ProgressTitle(`Building ${patchFileName} -- Running ${patcher.name}`);
    executePatcher(patcher.id, patcher.filesToPatch);
});
cleanPatchFile(patchFile);
SetCache(cache);
