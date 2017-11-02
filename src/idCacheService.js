ngapp.service('idCacheService', function(patcherService) {
    let prepareIdCache = function(patchFile) {
        let cache = patcherService.settings.cache,
            fileName = xelib.Name(patchFile);
        if (!cache.hasOwnProperty(fileName)) cache[fileName] = {};
        return cache[fileName];
    };

    this.newRecord = function(patchFile) {
        let idCache = prepareIdCache(patchFile),
            forms = Object.values(idCache);

        let getNewFormId = function() {
            let form = xelib.GetNextObjectID(patchFile);
            while (forms.includes(form)) form++;
            forms.push(form);
            return form;
        };

        return function(group, signature, id) {
            if (!idCache.hasOwnProperty(id)) idCache[id] = getNewFormId();
            let rec = xelib.AddElement(group, signature);
            xelib.SetFormID(rec, idCache[id], true, false);
            if (xelib.HasElement(rec, 'EDID')) xelib.SetValue(rec, 'EDID', id);
            return rec;
        };
    };
});