module.exports = ({ngapp, fh}) =>
ngapp.service('patchPluginWorker', function(progressService, patcherWorker) {
    this.run = function(cache, patchPlugin) {
        let start = new Date();

        let progressTitle = function(title) {
            progressService.progressTitle(title);
        };

        let patcherProgress = function(message) {
            progressService.addProgress(1);
            progressService.progressMessage(message);
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

        let cleanPatchFile = function(patchFile) {
            patcherProgress('Removing ITPOs and cleaning masters.');
            try {
                xelib.RemoveIdenticalRecords(patchFile, false, true);
            } catch (x) {
                progressService.logMessage('Removing ITPOs failed: ' + x.message);
            }
            xelib.CleanMasters(patchFile);
        };

        // MAIN WORKER EXECUTION
        let patchFileName = patchPlugin.filename,
            patchFile = preparePatchFile(patchFileName);
        patchPlugin.patchers.forEach(function(patcher) {
            if (!patcher.active) return;
            progressTitle(`Building ${patchFileName} ~ Running ${patcher.name}`);
            patcherWorker.run(cache, patchFileName, patchFile, patcher);
        });
        cleanPatchFile(patchFile);
        console.log(`Generated ${patchFileName} in ${new Date() - start}ms`);
    };
});
