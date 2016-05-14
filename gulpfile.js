const gulp = require('gulp');
const mocha = require('gulp-mocha');
const coveralls = require('gulp-coveralls');
const cover = require('gulp-coverage');

gulp.task('test', () => {
    return gulp.src('test/**/*.test.js', {read: false})
        .pipe(mocha());
});


gulp.task('coverage', function () {
    return gulp.src('test/**/*.test.js', {read: false})
        .pipe(cover.instrument({
            pattern: ['src/**/*.js']
        }))
        .pipe(mocha())
        .pipe(cover.gather())
        .pipe(cover.format())
        .pipe(gulp.dest('reports'));
});

gulp.task('coveralls', function () {
    return gulp.src('test/**/*.test.js', {read: false})
        .pnpmipe(cover.instrument({
            pattern: ['src/**/*.js']
        }))
        .pipe(mocha()) // or .pipe(jasmine()) if using jasmine
        .pipe(cover.gather())
        .pipe(cover.format({reporter: 'lcov'}))
        .pipe(coveralls());
});

