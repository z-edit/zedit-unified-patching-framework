module.exports = function(args) {
    let {fh, modulePath} = args,
        helpers = require('./src/helpers')(args),
        srcPath = fh.path(modulePath, 'src');

    fh.getFiles(srcPath, {
        matching: '**/*.js'
    }).forEach(filePath => {
        let filename = fh.getFileName(filePath);
        if (filename === 'helpers.js') return;
        require(filePath)(args, helpers);
    });
};

