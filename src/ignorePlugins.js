ngapp.directive('ignorePlugins', function() {
    return {
        restrict: 'E',
        scope: {
            patcherId: '@'
        },
        templateUrl: `${moduleUrl}/partials/ignorePlugins.html`,
        controller: 'ignorePluginsController'
    }
});

ngapp.controller('ignorePluginsController', function($scope, patcherService) {
    // helper functions
    let updateIgnoredFiles = function() {
        let settings = patcherService.settings[$scope.patcherId];
        settings.ignoredFiles = $scope.ignoredPlugins
            .filter((item) => !item.invalid)
            .map((item) => item.filename);
    };

    let getValid = function(item, itemIndex) {
        let filename = item.filename,
            isRequired = $scope.requiredPlugins.includes(filename),
            duplicate = $scope.ignoredPlugins.find((item, index) => {
                return item.filename === filename && index < itemIndex;
            });
        return !isRequired && !duplicate;
    };

    // scope functions
    $scope.toggleExpanded = function() {
        if ($scope.ignoredPlugins.length === 0) return;
        $scope.expanded = !$scope.expanded;
    };

    $scope.addIgnoredPlugin = function() {
        if (!$scope.expanded) $scope.expanded = true;
        $scope.ignoredPlugins.push({ filename: 'Plugin.esp' });
        $scope.onChange();
    };

    $scope.removeIgnoredPlugin = function(index) {
        $scope.ignoredPlugins.splice(index, 1);
        $scope.onChange();
    };

    $scope.onChange = function() {
        $scope.ignoredPlugins.forEach(function(item, index) {
            item.invalid = !getValid(item, index);
        });
        updateIgnoredFiles();
    };

    // initialization
    if (!$scope.patcherId)
        throw 'ignorePlugins Directive: patcher-id is required.';

    let patcher = patcherService.getPatcher($scope.patcherId),
        ignored = patcherService.getIgnoredFiles(patcher);

    $scope.requiredPlugins = patcherService.getRequiredFiles(patcher);
    $scope.ignoredPlugins = ignored.map(filename => ({filename: filename}));
});