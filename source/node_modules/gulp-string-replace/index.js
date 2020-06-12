/**
 * Gulp String Replace
 * https://github.com/tomaszczechowski/gulp-string-replace
 *
 * Copyright by Tomasz Czechowski
 * MIT license.
 */

'use strict';

var through = require('through2')
  , rs = require('replacestream')
  , chalk = require('chalk')
  , fancyLog = require('fancy-log')
  , PluginError = require('plugin-error')
  , extend = require('extend');

var defaultOptions = {
  searchValue: 'regex', // 'regex' or 'string'
  logs: {
    enabled: true,
    notReplaced: false
  }
};

module.exports = function (replaceFrom, replaceTo, userOptions) {
  var options = extend(true, {}, defaultOptions, userOptions);

  var log = function (result, from, to, fileName) {
    if (!options.logs.enabled || (!options.logs.notReplaced && !result)) return;

    var _result = result ? 'Replaced:' : 'Not Replaced:';
    var _from = '"' + chalk.cyan(from) + '"';
    var _to = to
      ? (' to "' + chalk.cyan(to) + '"')
      : '';

    fancyLog(_result + ' ' + _from + _to + ' ' + 'in a file: ' + chalk.magenta(fileName));

    return true;
  };

  return through.obj(function (file, enc, callback) {
    var fileName = file.path.split('/')[file.path.split('/').length - 1];

    var _replaceTo = function (replacement) {
      if (typeof replaceTo === 'function') {
        var replaceFunctionResult = replaceTo.apply(replaceTo, arguments);

        log(true, replacement, replaceFunctionResult, fileName);

        return replaceFunctionResult;
      }

      log(true, replacement, replaceTo, fileName);

      return replaceTo;
    };

    if (file.isStream()) {
      file.contents = file.contents.pipe(rs(replaceFrom, _replaceTo));
      return callback(null, file);
    }

    if (file.isBuffer()) {
      try {
        var contents = String(file.contents);
        var noticedInCode = false;

        if (options.searchValue === 'regex') {
          replaceFrom = replaceFrom instanceof RegExp
            ? replaceFrom
            : new RegExp(replaceFrom, 'g');

          noticedInCode = replaceFrom.test(contents);
        }

        if (options.searchValue === 'string') {
          noticedInCode = contents.indexOf(replaceFrom) > -1;
        }

        if (noticedInCode) {
          contents = contents.replace(replaceFrom, _replaceTo);
        } else {
          log(false, replaceFrom, false, fileName);
        }

        file.contents = new Buffer.from(contents);
      } catch (e) {
        return callback(new PluginError('gulp-string-replace', e));
      }
    }

    callback(null, file);
  });
};
