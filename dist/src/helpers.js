module.exports = function({moduleUrl}) {
    let openManagePatchersModal = function(scope) {
        scope.$emit('openModal', 'managePatchers', {
            basePath: `${moduleUrl}/partials`
        });
    };

    return { openManagePatchersModal };
};
