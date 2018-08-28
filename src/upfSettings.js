ngapp.controller('upfSettingsController', function($timeout, $scope) {
    $scope.bannerStyle = {
        'background': `url('${moduleUrl}/images/banner.jpg')`,
        'background-size': 'cover'
    };

    $scope.managePatchers = function() {
        $scope.saveSettings(false);
        $timeout(() => openManagePatchersModal($scope));
    };

    $scope.reloadPatchers = () => $scope.$emit('reloadPatchers');
});