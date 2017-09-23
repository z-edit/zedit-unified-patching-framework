let upfOverviewController = function($scope) {
    $scope.games = xelib.games;
    $scope.upfPages = [
        'Development/APIs/UPF Patcher API',
        'Modal Views/Manage Patchers Modal',
        'Modules/Patcher Modules',
        'Modal Views/Settings Modal/UPF Settings Tab'
    ].map(function(path) {
        return {
            label: path.split('/').last(),
            path: path
        };
    });
};

let upfPatcherApiController = function($scope) {
    ['patcherSchema', 'patcherHelpers'].forEach(function(label) {
        $scope[label] = fh.loadJsonFile(`${patcherPath}/docs/${label}.json`);
    });
};

let patcherModulesController = function($scope) {
    let path = `${patcherPath}/docs/patcherVariables.json`;
    $scope.patcherVariables = fh.loadJsonFile(path);
};

let topics = [{
    path: 'Modules/Core Modules',
    topic: {
        label: 'Unified Patching Framework',
        templateUrl: `${modulePath}/docs/overview.html`,
        controller: upfOverviewController
    }
}, {
    path: 'Modules',
    topic: {
        label: 'Patcher Modules',
        templateUrl: `${modulePath}/docs/patcherModules.html`,
        controller: patcherModulesController
    }
}, {
    path: 'Modal Views',
    topic: {
        label: 'Manage Patchers Modal',
        templateUrl: `${modulePath}/docs/managePatchersModal.html`,
        children: [{
            label: 'Build Patches Tab',
            templateUrl: `${modulePath}/docs/buildPatches.html`
        }]
    }
}, {
    path: 'Modal Views/Settings Modal',
    topic: {
        label: 'UPF Settings Tab',
        templateUrl: `${modulePath}/docs/upfSettings.html`
    }
}, {
    path: 'Development/APIs',
    topic: {
        label: 'UPF Patcher API',
        templateUrl: `${modulePath}/docs/api.html`,
        controller: upfPatcherApiController
    }
}];

ngapp.run(function(helpService) {
    topics.forEach(({path, topic}) => helpService.addTopic(topic, path));
});