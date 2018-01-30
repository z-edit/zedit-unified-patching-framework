ngapp.service('idCacheService', function(patcherService) {
    let prepareIdCache = function(patchFile) {
        let cache = patcherService.settings.cache,
            fileName = xelib.Name(patchFile);
        if (!cache.hasOwnProperty(fileName)) cache[fileName] = {};
        return cache[fileName];
    };

    this.cacheRecord = function(patchFile) {
        let idCache = prepareIdCache(patchFile),
            forms = Object.values(idCache),
            nextForm = xelib.GetNextObjectID(patchFile);

        let getNewFormId = function() {
            while (forms.includes(nextForm)) nextForm++;
            forms.push(nextForm);
            return nextForm++;
        };

        return function(rec, id) {
            if (!idCache.hasOwnProperty(id)) idCache[id] = getNewFormId();
            xelib.SetFormID(rec, idCache[id], true, false);
            if (xelib.HasElement(rec, 'EDID')) xelib.SetValue(rec, 'EDID', id);
            return rec;
        };
    };
});