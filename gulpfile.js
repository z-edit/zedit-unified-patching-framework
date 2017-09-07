var gulp = require('gulp'),
    include = require('gulp-include');

gulp.task('build', function () {
    console.log('-- gulp is running task "build"');

    gulp.src('index.js')
        .pipe(include())
        .on('error', console.log)
        .pipe(gulp.dest('dist'));

    gulp.src('partials/*.html')
        .pipe(gulp.dest('dist/partials'));

    gulp.src('images/*')
        .pipe(gulp.dest('dist/images'));

    gulp.src('module.json')
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);