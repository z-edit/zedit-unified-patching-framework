module.exports = ({ngapp}, {openManagePatchersModal}) =>
ngapp.run(function(contextMenuService) {
    // add manage patchers context menu item to tree view context menu
    let menuItems = contextMenuService.getContextMenu('treeView');
    let automateIndex = menuItems.findIndex(item => {
        return item.id === 'Automate';
    });

    menuItems.splice(automateIndex + 1, 0, {
        id: 'Manage Patchers',
        visible: () => true,
        build: (scope, items) => {
            items.push({
                label: 'Manage Patchers',
                hotkey: 'Ctrl+Shift+P',
                callback: () => openManagePatchersModal(scope)
            });
        }
    });
});
