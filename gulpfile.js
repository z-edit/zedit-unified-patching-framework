const fs = require('fs'),
      gulp = require('gulp'),
      clean = require('gulp-clean'),
      rename = require('gulp-rename'),
      zip = require('gulp-zip');

let files = ['index.js', 'module.json', 'LICENSE', 'README.md'];
let folders = ['src/**/*.js', 'partials/*.html', 'images/*', 'docs/*'];

let loadModuleInfo = function() {
    let text = fs.readFileSync('module.json', 'utf8');
    return JSON.parse(text);
};

gulp.task('clean', function() {
    return gulp.src('dist', { read: false }).pipe(clean());
});

gulp.task('build', gulp.series('clean', function(done) {
    files.forEach(filename => {
        gulp.src(filename).pipe(gulp.dest('dist'));
    });

    folders.forEach(path => {
        let name = path.split('/').shift();
        gulp.src(path).pipe(gulp.dest(`dist/${name}`));
    });

    done();
}));

gulp.task('release', function() {
    let {id, version} = loadModuleInfo(),
        zipFileName = `${id}-v${version}.zip`;

    console.log(`Packaging ${zipFileName}`);

    return gulp.src('dist/**/*', { base: 'dist/'})
        .pipe(rename((path) => path.dirname = `${id}/${path.dirname}`))
        .pipe(zip(zipFileName))
        .pipe(gulp.dest('.'));
});

gulp.task('watch', function() {
    files.forEach(filename => gulp.watch(filename, ['build']));
    folders.forEach(folder => gulp.watch(folder, ['build']));
});

gulp.task('default', gulp.series('build', 'watch'));
