ngapp.controller('upfSettingsController', function($timeout, $scope) {
    $scope.bannerStyle = {
        'background': `url('${modulePath}/images/banner.jpg')`,
        'background-size': 'cover'
    };

    $scope.managePatchers = function() {
        $scope.saveSettings(false);
        $timeout(() => openManagePatchersModal($scope));
    };
});