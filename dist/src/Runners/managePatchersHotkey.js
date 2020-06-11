module.exports = ({ngapp}, {openManagePatchersModal}) =>
ngapp.run(function(hotkeyService) {
    hotkeyService.addHotkeys('editView', {
        p: [{
            modifiers: ['ctrlKey', 'shiftKey'],
            callback: openManagePatchersModal
        }],
        f5: [{
            modifiers: ['altKey'],
            callback: scope => {
                if (scope.$root.modalActive) return;
                scope.$emit('reloadPatchers')
            }
        }]
    });
});
