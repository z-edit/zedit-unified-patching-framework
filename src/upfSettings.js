ngapp.controller('upfSettingsController', function($timeout, $scope) {
    $scope.managePatchers = function() {
        $scope.saveSettings(false);
        $timeout(() => openManagePatchersModal($scope));
    };
});