# gulp-string-replace [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![dependencies][gulp-string-replace-dependencies-image]][gulp-string-replace-dependencies-url]
> Replaces strings in files by using string or regex patterns. Works with Gulp 3!

## Usage

```shell
npm install gulp-string-replace --save-dev
```
### Regex Replace
```javascript
var replace = require('gulp-string-replace');

gulp.task('replace_1', function() {
  gulp.src(["./config.js"]) // Any file globs are supported
    .pipe(replace(new RegExp('@env@', 'g'), 'production'))
    .pipe(gulp.dest('./build/config.js'))
});

gulp.task('replace_2', function() {
  gulp.src(["./index.html"])
    .pipe(replace(/version(={1})/g, '$1v0.2.2'))
    .pipe(gulp.dest('./build/index.html'))
});

gulp.task('replace_3', function() {
  gulp.src(["./config.js"])
    .pipe(replace(/foo/g, function () {
        return 'bar';
    }))
    .pipe(gulp.dest('./build/config.js'))
});
```
### String Replace
```javascript
gulp.task('replace_1', function() {
  gulp.src(["./config.js"])
    .pipe(replace('environment', 'production'))
    .pipe(gulp.dest('./build/config.js'))
});
```
### Function Replace
```javascript
gulp.task('replace_1', function() {
  gulp.src(["./config.js"])
    .pipe(replace('environment', function () {
        return 'production';
    }))
    .pipe(gulp.dest('./build/config.js'))
});

gulp.task('replace_2', function() {
  gulp.src(["./config.js"])
    .pipe(replace('environment', function (replacement) {
        return replacement + '_mocked';
    }))
    .pipe(gulp.dest('./build/config.js'))
});

```

### Exampe with options object
```javascript

var options = {
  logs: {
    enabled: false
  }
};

gulp.task('replace_1', function() {
  gulp.src(["./config.js"])
    .pipe(replace('environment', 'dev', options)
    .pipe(gulp.dest('./build/config.js'))
});

```

```javascript

var options = {
  searchValue: 'string'
};

gulp.task('replace_1', function() {
  gulp.src(["./config.js"])
    .pipe(replace('(some value here /* ignore by sth */)(', 'dev', options)
    .pipe(gulp.dest('./build/config.js'))
});

```

### API

#### replace(pattern, replacement, options)

##### pattern
Type: `String` or `RegExp`

The string to search for.

##### replacement
Type: `String` or `Function`

The replacement string or function. Called once for each match.
Function has access to regex outcome (all arguments are passed).

##### options
Type: `Object`

###### options.searchValue
Type: `string`, Default: `regex`, Options: `regex` or `string`
Description: Used to determine if search value is regex or string.

###### options.logs.enabled
Type: `Boolean`, Default: `true`

Displaying logs.

###### options.logs.notReplaced
Type: `Boolean`, Default: `false`

Displaying "not replaced" logs.

More details here: [MDN documentation for RegExp] and [MDN documentation for String.replace].

### Release History
 * 2018-10-12  v1.1.2  Fixed issue wrong stream parameters.
 * 2018-07-13  v1.1.1  Moved gulp into devDependencies.
 * 2018-05-24  v1.1.0  Added support for node 8+ by replacing buffer with buffer.from. Added searchValue option. Updated dependencies.
 * 2017-12-31  v1.0.0  Removed a gulp-util, clean up and released v1.0.0
 * 2017-11-19  v0.4.0  Passed entire regex outcome to replace function.
 * 2017-01-04  v0.3.1  Improved documentation. Removed duplicated comments & Fixed typo.
 * 2016-11-30  v0.3.0  Default value for "notReplaced" set to "false".
 * 2016-09-24  v0.2.0  Added options object.
 * 2016-09-09  v0.1.1  Reorganization of files along with minor cosmetic changes.
 * 2016-03-09  v0.1.0  Initial version of plugin.

Task submitted by [Tomasz Czechowski](https://twitter.com/t_czechowski). License MIT.

[MDN documentation for RegExp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[MDN documentation for String.replace]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
[travis-url]: http://travis-ci.org/tomaszczechowski/gulp-string-replace
[travis-image]: https://secure.travis-ci.org/tomaszczechowski/gulp-string-replace.svg?branch=master
[npm-url]: https://npmjs.org/package/gulp-string-replace
[npm-image]: https://badge.fury.io/js/gulp-string-replace.svg
[gulp-string-replace-dependencies-image]: https://david-dm.org/tomaszczechowski/gulp-string-replace/status.png
[gulp-string-replace-dependencies-url]: https://david-dm.org/tomaszczechowski/gulp-string-replace#info=dependencies
