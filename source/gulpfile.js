'use strict';
const gulp = require("gulp");
const minify = require('gulp-minify');
const inject = require("gulp-inject-string");
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('buildJs', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(inject.replace('var behaviourTree;', ''))
        .pipe(inject.replace('var fsm;', ''))
        .pipe(inject.replace('var utilityAI;', ''))
        .pipe(inject.prepend('window.fsm = {}; window.behaviourTree = {}; window.utilityAI = {};\n'))
        .pipe(inject.replace('var __extends =', 'window.__extends ='))
        .pipe(minify({ ext: { min: ".min.js" } }))
        .pipe(gulp.dest('./bin'));
});

gulp.task("buildDts", ["buildJs"], () => {
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest('./bin'));
});

gulp.task("build", ["buildDts"], () => {
    return gulp.src('bin/**/*')
        // .pipe(gulp.dest('../demo/libs/aiTree/'))
});
