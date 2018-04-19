ngapp.service('idCacheService', function(patcherService) {
    let prepareIdCache = function(patchFile) {
        let cache = patcherService.settings.cache,
            fileName = xelib.Name(patchFile);
        if (!cache.hasOwnProperty(fileName)) cache[fileName] = {};
        return cache[fileName];
    };

    this.cacheRecord = function(patchFile) {
        let idCache = prepareIdCache(patchFile);

        return function(rec, id) {
            if (!xelib.IsMaster(rec)) return;
            if (idCache.hasOwnProperty(id)) {
                xelib.SetFormID(rec, idCache[id], true, false);
            } else {
                idCache[id] = xelib.GetFormID(rec, true);
            }
            if (xelib.HasElement(rec, 'EDID')) xelib.SetValue(rec, 'EDID', id);
            return rec;
        };
    };
});