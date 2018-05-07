ngapp.service('idCacheService', function(patcherService) {
    let prepareIdCache = function(patchFile) {
        let cache = patcherService.settings.cache,
            fileName = xelib.Name(patchFile);
        if (!cache.hasOwnProperty(fileName)) cache[fileName] = {};
        return cache[fileName];
    };

    let updateNextFormId = function(patchFile, idCache) {
        let formIds = Object.values(idCache),
            maxFormId = formIds.reduce((a, b) => Math.max(a, b), 0x7FF);
        xelib.SetNextObjectID(patchFile, maxFormId + 1);
    };

    this.cacheRecord = function(patchFile) {
        let idCache = prepareIdCache(patchFile),
            usedIds = {};

        updateNextFormId(patchFile, idCache);

        return function(rec, id) {
            if (!xelib.IsMaster(rec)) return;
            if (usedIds.hasOwnProperty(id))
                throw new Error(`cacheRecord: ${id} is not unique.`);
            if (idCache.hasOwnProperty(id)) {
                xelib.SetFormID(rec, idCache[id], true, false);
            } else {
                idCache[id] = xelib.GetFormID(rec, true);
            }
            if (xelib.HasElement(rec, 'EDID')) xelib.SetValue(rec, 'EDID', id);
            usedIds[id] = true;
            return rec;
        };
    };
});