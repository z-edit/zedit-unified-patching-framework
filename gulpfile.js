const fs = require('fs'),
      gulp = require('gulp'),
      clean = require('gulp-clean'),
      include = require('gulp-include'),
      rename = require('gulp-rename'),
      zip = require('gulp-zip');

gulp.task('clean', function() {
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

gulp.task('build', ['clean'], function() {
    gulp.src('index.js')
        .pipe(include())
        .on('error', console.log)
        .pipe(gulp.dest('dist'));

    gulp.src('partials/*.html')
        .pipe(gulp.dest('dist/partials'));

    gulp.src('images/*')
        .pipe(gulp.dest('dist/images'));

    gulp.src('docs/*')
        .pipe(gulp.dest('dist/docs'));

    gulp.src('module.json')
        .pipe(gulp.dest('dist'));
});

gulp.task('release', function() {
    let moduleInfo = JSON.parse(fs.readFileSync('module.json')),
        moduleId = moduleInfo.id,
        moduleVersion = moduleInfo.version,
        zipFileName = `${moduleId}-v${moduleVersion}.zip`;

    console.log(`Packaging ${zipFileName}`);

    gulp.src('dist/**/*', { base: 'dist/'})
        .pipe(rename((path) => path.dirname = `${moduleId}/${path.dirname}`))
        .pipe(zip(zipFileName))
        .pipe(gulp.dest('.'));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['build']);
    gulp.watch('partials/**/*.html', ['build']);
    gulp.watch('images/**/*', ['build']);
    gulp.watch('module.json', ['build']);
});

gulp.task('default', ['build', 'watch']);
