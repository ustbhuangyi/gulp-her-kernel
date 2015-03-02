/**
 * her uri
 */
'use strict';

var vinyl = require('vinyl');
var minimatch = require('minimatch');

var uri = module.exports = function (path, dirname) {
  var info = her.util.stringQuote(path);
  var connector = her.config.get('namespaceConnector', ':')
  if (info.rest) {
    path = info.rest;
    //if is not a standard path
    if (path.indexOf(connector) === -1) {
      var file;
      if (path[0] === '/') {
        file = her.project.getPath(path);
      } else if (dirname) {
        file = her.util.normalize(dirname, path);
      } else {
        throw new Error('invalid dirname.');
      }
      if (file && her.util.isFile(file)) {
        var c = new Buffer(her.util.read(file));
        info.file = her.file(new vinyl({
          path: file,
          base: her.project.getPath(),
          contents: c
        }));
      }
    }
  }
  return info;
};

//get the relative id, standard the path
uri.getId = function (path, dirname) {
  var info = uri(path, dirname);

  if (info.file) {
    info.id = info.file.getId();
  } else {
    info.id = info.rest;
  }
  return info;
};

//map the source path to the published path
uri.roadmap = function (path, opt, obj) {
  var map = her.config.get('roadmap.' + opt, {});
  obj = obj || {};
  her.util.map(map, function (type, rule) {
    var condition = rule.src;

    if (her.util.isString(condition)) {
      if (minimatch(path, her.util.unrelative(process.cwd(), condition))) {
        obj.release = her.util.normalizeRelease(rule.release);
        return true;
      }
    }
    else if (her.util.isArray(condition)) {
      if (!condition.length) {
        throw new Error('match: empty glob array');
      }
      var ret = false;
      for (var i = 0; i < condition.length; i++) {
        var step = her.util.unrelative(process.cwd(), condition[i]);
        if (step[0] === '!') {
          if (minimatch(path, step.slice(1))) {
            ret = false;
            break;
          }
        }
        else if (minimatch(path, step)) {
          ret = true;
        }
      }
      if (ret) {
        obj.release = her.util.normalizeRelease(rule.release);
        return ret;
      }
    } else {
      throw new Error('roadmap src must be a glob string or glob array');
    }
  });
};


