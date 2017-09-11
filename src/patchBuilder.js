ngapp.service('patchBuilder', function(patcherService) {
    let cache = {};

    // private functions
    let getOrCreatePatchRecord = function(patchFile, record) {
        return xelib.AddElement(patchFile, xelib.GetHexFormID(record));
    };

    let getFile = function(filename) {
        if (!cache[filename]) {
            cache[filename] = { handle: xelib.FileByName(filename) };
        }
        return cache[filename];
    };

    let getRecords = function(filename, search, includeOverrides) {
        let file = getFile(filename),
            cacheKey = `${search}_${+includeOverrides}`;
        if (!file[cacheKey]) {
            file[cacheKey] = xelib.GetRecords(file.handle, search, includeOverrides);
        }
        return file[cacheKey];
    };

    let getPatcherHelpers = function(patcher, filesToPatch) {
        return {
            LoadRecords: function(search, includeOverrides = false) {
                return filesToPatch.reduce(function(records, filename) {
                    return records.concat(getRecords(filename, search, includeOverrides));
                }, []);
            },
            AllSettings: patcherService.settings
            // TODO: More helpers here?
        }
    };

    let getRecordsToPatch = function(load, filename, settings, locals) {
        let plugin = getFile(filename),
            loadOpts = load(plugin.handle, settings, locals);
        if (!loadOpts) return [];
        let records = getRecords(filename, loadOpts.signature, false);
        return loadOpts.filter ? records.filter(loadOpts.filter) : records;
    };

    let executeProcessBlock = function(processBlock, patchFile, filesToPatch, settings, locals) {
        let load = processBlock.load,
            patch = processBlock.patch;
        filesToPatch.forEach(function(filename) {
            let recordsToPatch = getRecordsToPatch(load, filename, settings, locals);
            if (recordsToPatch.length === 0) return;
            recordsToPatch.forEach(function(record) {
                let patchRecord = getOrCreatePatchRecord(patchFile, record);
                patch(patchRecord, settings, locals);
            });
        });
    };

    // public functions
    this.executePatcher = function(scope, patcherId, filesToPatch, patchFile) {
        let patcher = patcherService.getPatcher(patcherId),
            exec = patcher.execute,
            settings = patcherService.settings[patcherId],
            helpers = getPatcherHelpers(patcher, filesToPatch),
            locals = {};

        exec.initialize && exec.initialize(patchFile, helpers, settings, locals);
        exec.process && exec.process.forEach(function(processBlock) {
            executeProcessBlock(processBlock, patchFile, filesToPatch, settings, locals);
        });
        exec.finalize && exec.finalize(patchFile, helpers, settings, locals);
    };

    this.preparePatchFile = function(filename) {
        if (!xelib.HasElement(0, filename)) {
            let dataPath = xelib.GetGlobal('DataPath');
            fh.jetpack.cwd(dataPath).remove(filename);
        }
        let patchFile = xelib.AddElement(0, filename);
        xelib.NukeFile(patchFile);
        xelib.AddAllMasters(patchFile);
        return patchFile;
    };

    this.cleanPatchFile = function(patchFile) {
        // TODO: uncomment when fixed
        // xelib.RemoveIdenticalRecords(patchFile);
        xelib.CleanMasters(patchFile);
    };

    this.clearCache = () => cache = {};
});