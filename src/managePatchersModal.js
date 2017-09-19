ngapp.controller('managePatchersModalController', function($scope, patcherService) {
    // helper functions
    let selectTab = function(tab) {
        $scope.tabs.forEach((tab) => tab.selected = false);
        $scope.currentTab = tab;
        $scope.currentTab.selected = true;
        $scope.onBuildPatchesTab = $scope.currentTab.label === 'Build Patches';
    };

    // initialize scope variables
    $scope.settings = patcherService.settings;
    $scope.tabs = patcherService.getTabs();
    $scope.noPatchers = $scope.tabs.length === 1;
    selectTab($scope.tabs[0]);

    // scope functions
    $scope.closeModal = function() {
        patcherService.saveSettings();
        $scope.$emit('closeModal');
    };

    $scope.onTabClick = function(e, tab) {
        e.stopPropagation();
        if (tab === $scope.currentTab) return;
        selectTab(tab);
    };
});