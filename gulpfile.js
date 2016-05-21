const gulp = require('gulp');
const mocha = require('gulp-mocha');
const babel = require('gulp-babel');
const istanbul = require('gulp-babel-istanbul');
const injectModules = require('gulp-inject-modules');

gulp.task('test', () => {
    return gulp.src('test/**/*.test.js', {read: false})
        .pipe(mocha());
});


gulp.task('coverage', function (cb) {
    gulp.src('src/**/*.js')
        .pipe(istanbul())
        .pipe(istanbul.hookRequire()) // or you could use .pipe(injectModules())
        .on('finish', function () {
            gulp.src('test/**/*.test.js')
                .pipe(babel())
                .pipe(injectModules())
                .pipe(mocha())
                .pipe(istanbul.writeReports())
                .on('end', cb);
        });
});
