/**
 * her config
 */
'use strict';

var DEFALUT_SETTINGS = {
  namespaceConnector: ':',
  project: {
    charset: 'utf8',
    md5Length: 7,
    md5Connector: '_'
  }
};

//merge from target to source
function merge(source, target) {
  if (typeof source === 'object' && typeof target === 'object') {
    for (var key in target) {
      if (target.hasOwnProperty(key)) {
        source[key] = merge(source[key], target[key]);
      }
    }
  } else {
    source = target;
  }
  return source;
}

var Config = Object.derive({
  constructor: function () {
    this.init.apply(this, arguments);
  },
  init: function () {
    this.data = {};
    if (arguments.length > 0) {
      this.merge.apply(this, arguments);
    }
    return this;
  },
  get: function (path, def) {
    var result = this.data || {};
    (path || '').split('.').forEach(function (key) {
      if (key && (typeof result !== 'undefined')) {
        result = result[key];
      }
    });
    if (typeof result === 'undefined') {
      return def;
    } else {
      return result;
    }
  },
  set: function (path, value) {
    if (typeof value === 'undefined') {
      this.data = path;
    } else {
      path = String(path || '').trim();
      if (path) {
        var paths = path.split('.');
        var last = paths.pop();
        var data = this.data || {};
        paths.forEach(function (key) {
          var type = typeof data[key];
          if (type === 'object') {
            data = data[key];
          } else if (type === 'undefined') {
            data = data[key] = {};
          } else {
            throw  new Error('forbidden to set property[' + key + '] of [' + type + '] data');
          }
        });
        data[last] = value;
      }
    }
    return this;
  },
  del: function (path) {
    path = String(path || '').trim();
    if (path) {
      var paths = path.split('.');
      var data = this.data;
      var last = paths.pop();
      var key;
      for (var i = 0, len = paths.length; i < len; i++) {
        key = paths[i];
        if (typeof data[key] === 'object') {
          data = data[key];
        } else {
          return this;
        }
      }
      if (typeof data[last] !== 'undefined') {
        delete data[last];
      }
    }
    return this;
  },
  merge: function () {
    var self = this;
    [].slice.call(arguments).forEach(function (arg) {
      if (typeof arg === 'object') {
        merge(self.data, arg);
      } else {
        throw new Error('unable to merge data[' + arg + '].');
      }
    });
    return this;
  }
});

module.exports = (new Config).init(DEFALUT_SETTINGS);
module.exports.Config = Config;
