/**
 * her project
 */
'use strict';

var project = module.exports;

var rootPath;

function getPath(root, args) {
  if (args && args.length > 0) {
    args = root + '/' + Array.prototype.join.call(args, '/');
    return her.util.normalize(args);
  } else {
    return her.util.normalize(root);
  }
}

project.setRoot = function (path) {
  if (her.util.isDir(path)) {
    rootPath = her.util.realpath(path);
  } else {
    throw new Error('invalid project root path [' + path + ']');
  }
};

project.getPath = function () {
  if (rootPath) {
    return getPath(rootPath, arguments);
  } else {
    throw new Error('undefined project root');
  }
};
