/**
 * utils
 */
'use strict';

var fs = require('fs');
var pth = require('path');
var crypto = require('crypto');
var _exists = fs.existsSync || pth.existsSync;
var iconv = require('iconv-lite');

var _ = module.exports;

var IS_WIN = process.platform.indexOf('win') === 0;

var TEXT_FILE_EXTS = [
  'css', 'tpl', 'js', 'php',
  'txt', 'json', 'xml', 'htm',
  'text', 'xhtml', 'html', 'md',
  'conf', 'po', 'config', 'tmpl',
  'coffee', 'less', 'sass', 'jsp',
  'scss', 'manifest', 'bak', 'asp',
  'tmp', 'haml', 'jade', 'aspx',
  'ashx', 'java', 'py', 'c', 'cpp',
  'h', 'cshtml', 'asax', 'master',
  'ascx', 'cs', 'ftl', 'vm', 'ejs',
  'styl', 'jsx', 'handlebars'
];
var IMAGE_FILE_EXTS = [
  'svg', 'tif', 'tiff', 'wbmp',
  'png', 'bmp', 'fax', 'gif',
  'ico', 'jfif', 'jpe', 'jpeg',
  'jpg', 'woff', 'cur', 'webp',
  'swf', 'ttf', 'eot'
];

//parse the str from the quotes
_.stringQuote = function (str, quotes) {
  var info = {
    origin: str,
    rest: str = str.trim(),
    quote: ''
  };
  if (str) {
    quotes = quotes || '\'"';
    var strLen = str.length - 1;
    for (var i = 0, len = quotes.length; i < len; i++) {
      var c = quotes[i];
      if (str[0] === c && str[strLen] === c) {
        info.quote = c;
        info.rest = str.substring(1, strLen);
        break;
      }
    }
  }
  return info;
};

//get the real path
_.realpath = function (path) {
  if (path && _exists(path)) {
    path = fs.realpathSync(path);
    if (IS_WIN) {
      path = path.replace(/\\/g, '/');
    }
    if (path !== '/') {
      path = path.replace(/\/$/, '');
    }
    return path;
  } else {
    return false;
  }
};

//determines whether path is an absolute path
_.isAbsolute = function (path) {
  if (pth.isAbsolute) // the lastest node already support this function
    return pth.isAbsolute(path);
  if (IS_WIN) {
    return /^[a-z]:/i.test(path);
  } else {
    if (path === '/') {
      return true;
    } else {
      var split = path.split('/');
      if (split[0] === '~') {
        return true;
      } else if (split[0] === '' && split[1]) {
        return _.isDir('/' + split[1] + '/' + split[2]);
      } else {
        return false;
      }
    }
  }
};

//path normalize
_.normalize = function (path) {
  if (arguments.length > 1) {
    path = Array.prototype.join.call(arguments, '/');
  } else if (_.isString(path)) {
    //do nothing for quickly determining.
  } else if (_.isObject(path)) {
    path = Array.prototype.join.call(path, '/');
  } else if (_.isUndefined(path)) {
    path = '';
  }
  if (path) {
    path = pth.normalize(path.replace(/[\/\\]+/g, '/')).replace(/\\/g, '/');
    if (path !== '/') {
      path = path.replace(/\/$/, '');
    }
  }
  return path;
};

//normalize the release path by replace the dest to ''
_.normalizeRelease = function (path) {
  var dest = her.config.get('dest', '');
  if (dest) {
    var rDest = _.pregQuote(dest);
    var reg = new RegExp('^' + rDest);
    return path.replace(reg, '');
  }
  return path;
};

//get hash & query part of url str
_.query = function (str) {
  var rest = str;
  var pos = rest.indexOf('#');
  var hash = '';
  var query = '';
  if (pos > -1) {
    hash = rest.substring(pos);
    rest = rest.substring(0, pos);
  }
  pos = rest.indexOf('?');
  if (pos > -1) {
    query = rest.substring(pos);
    rest = rest.substring(0, pos);
  }
  rest = rest.replace(/\\/g, '/');
  if (rest !== '/') {
    rest = rest.replace(/\/\.?$/, '');
  }
  return {
    origin: str,
    rest: rest,
    hash: hash,
    query: query
  };
};

//solve the relative path from 'from' to 'to'
_.relative = function (from, to) {
  return pth.relative(from, to);
};

//resolves 'to' to an absolute path
_.resolve = function (from, to) {
  return pth.resolve(from, to);
};

//return the directory name of a path
_.dirname = function (path) {
  return pth.dirname(path);
};

//return the extension of the path
_.ext = function (path) {
  return pth.extname(path);
}

//is a file
_.isFile = function (path) {
  return _exists(path) && fs.statSync(path).isFile();
};

//is utf8 bytes
_.isUtf8 = function (bytes) {
  var i = 0;
  while (i < bytes.length) {
    if ((// ASCII
      0x00 <= bytes[i] && bytes[i] <= 0x7F
      )) {
      i += 1;
      continue;
    }

    if ((// non-overlong 2-byte
      (0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
      (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF)
      )) {
      i += 2;
      continue;
    }

    if (
      (// excluding overlongs
      bytes[i] == 0xE0 &&
      (0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
      ) || (// straight 3-byte
      ((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
      bytes[i] == 0xEE ||
      bytes[i] == 0xEF) &&
      (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
      ) || (// excluding surrogates
      bytes[i] == 0xED &&
      (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x9F) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
      )
    ) {
      i += 3;
      continue;
    }

    if (
      (// planes 1-3
      bytes[i] == 0xF0 &&
      (0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
      (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
      ) || (// planes 4-15
      (0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
      (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
      (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
      ) || (// plane 16
      bytes[i] == 0xF4 &&
      (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
      (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
      )
    ) {
      i += 4;
      continue;
    }
    return false;
  }
  return true;
};

//read buffer
_.readBuffer = function (buffer) {
  if (_.isUtf8(buffer)) {
    buffer = buffer.toString('utf8');
    if (buffer.charCodeAt(0) === 0xFEFF) {
      buffer = buffer.substring(1);
    }
  } else {
    buffer = iconv.decode(buffer, 'gbk');
  }
  return buffer;
};

//read file content
_.read = function (path, convert) {
  var content = false;
  if (_exists(path)) {
    content = fs.readFileSync(path);
    if (convert || _.isTextFile(path)) {
      content = _.readBuffer(content);
    }
  } else {
    throw new Error('unable to read file[' + path + ']: No such file or directory.');
  }
  return content;
}

//is a directory
_.isDir = function (path) {
  return _exists(path) && fs.statSync(path).isDirectory();
};

//md5 method
_.md5 = function (data, len) {
  var md5sum = crypto.createHash('md5');
  var encoding = typeof data === 'string' ? 'utf8' : 'binary';
  md5sum.update(data, encoding);
  len = len || her.config.get('project.md5Length', 7);
  return md5sum.digest('hex').substring(0, len);
};

//escape special characters
_.pregQuote = function (str, delimiter) {
  return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
};

//is object
_.isObject = function (arg) {
  return typeof arg === 'object' && arg !== null;
};

//is string
_.isString = function (arg) {
  return typeof arg === 'string';
};

//is undefined
_.isUndefined = function (arg) {
  return arg === void 0;
};

//is array
_.isArray = function (arg) {
  return Array.isArray(arg);
};

// remove path relativity to make globs make sense
_.unrelative = function (cwd, glob) {
  var mod = '';
  if (glob[0] === '!') {
    mod = glob[0];
    glob = glob.slice(1);
  }
  return mod + pth.resolve(cwd, glob);
};

//merge target to the source
_.merge = function(source, target){
  if(_.isObject(source) && _.isObject(target)){
    _.map(target, function(key, value){
      source[key] = _.merge(source[key], value);
    });
  } else {
    source = target;
  }
  return source;
};

//foreach the obj and call the callback
_.map = function (obj, callback) {
  var index = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (callback(key, obj[key], index++)) {
        break;
      }
    }
  }
};

//is text file
_.isTextFile = function (path) {
  return getFileTypeReg('text').test(path || '');
};

//is image file
_.isImageFile = function (path) {
  return getFileTypeReg('image').test(path || '');
};

//get the filetype regex expression
function getFileTypeReg(type) {
  var map = [], ext = her.config.get('project.fileType.' + type);
  if (type === 'text') {
    map = TEXT_FILE_EXTS;
  } else if (type === 'image') {
    map = IMAGE_FILE_EXTS;
  } else {
    throw new Error('invalid file type [' + type + ']');
  }
  if (ext && ext.length) {
    if (typeof ext === 'string') {
      ext = ext.split(/\s*,\s*/);
    }
    map = map.concat(ext);
  }
  map = map.join('|');
  return new RegExp('\\.(?:' + map + ')$', 'i');
}

