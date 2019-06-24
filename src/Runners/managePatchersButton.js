module.exports = ({ngapp}, {openManagePatchersModal}) =>
ngapp.run(function($rootScope, buttonService) {
    let managePatchersButton = {
        class: 'fa fa-puzzle-piece',
        title: 'Manage Patchers',
        hidden: true,
        onClick: openManagePatchersModal
    };
    buttonService.addButton(managePatchersButton);

    // make button visible when edit mode is started
    $rootScope.$on('filesLoaded', function() {
        if ($rootScope.appMode.id !== 'edit') return;
        $rootScope.$applyAsync(() => managePatchersButton.hidden = false);
    });
});
