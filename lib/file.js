/**
 * her file
 * inherits from vinyl
 * add some features for file
 */
var util = require('util');
var vinyl = require('vinyl');

util.inherits(File, vinyl);

'use strict';

function File(file) {

  // clone our properties
  Object.keys(file).forEach(function (key) {
    this[key] = file[key];
  }, this);

  this.dirname = her.util.dirname(this.path);
  this.ext = her.util.ext(this.path);
  this.rExt = getReleaseExt(this.ext);

  this.useDomain = false;
  this.useHash = false;
  this.useMap = false;
  this.packed = false;
  this.requires = [];
  this.extras = {};

  if (her.util.isTextFile(this.rExt)) {
    switch (this.rExt) {
      case '.js':
      case '.coffee':
        this.isJsLike = true;
        this.useDomain = true;
        this.useHash = true;
        this.useMap = true;
        break;
      case '.css':
      case '.less':
      case '.sass':
      case '.styl':
        this.isCssLike = true;
        this.useDomain = true;
        this.useHash = true;
        this.useMap = true;
        break;
      case '.tpl':   //smarty template
        this.isHtmlLike = true;
        this.useMap = true;
        break;
      case '.json':
        this.isJsonLike = true;
        break;
    }
  } else if (her.util.isImageFile(this.ext)) {
    this.useDomain = true;
    this.useHash = this.ext !== '.ico';
  }

  //get file id
  var id = her.util.relative(her.project.getPath(), this.path);

  var ns = her.config.get('namespace');
  if (ns) {
    id = ns + her.config.get('namespaceConnector', ':') + id;
  }
  this.id = id;
  her.uri.roadmap(this.path, 'path', this);

  this.src = this.path;
  this.url = this.release ? getReleasePath(this) : this.path;
}

File.prototype.getId = function () {
  return this.id;
};

File.prototype.getUrl = function (withHash) {
  var url = this.url;
  if (withHash && this.useHash) {
    url = addHash(url, this);
  }
  return url;
};

File.prototype.getPath = function (withHash) {
  var path = this.path;
  if (withHash && this.useHash) {
    path = addHash(path, this);
  }
  return path;
};

File.prototype.isFile = function () {
  return her.util.isFile(this.path);
};

File.prototype.addRequire = function (id) {
  if (id && (id = id.trim())) {
    this.requires = this.requires || [];
    if (this.requires.indexOf(id) < 0) {
      this.requires.push(id);
    }
    return id;
  }
  return false;
};

File.prototype.getHash = function () {
  if (typeof this._md5 === 'undefined') {
    Object.defineProperty(this, '_md5', {
      value: her.util.md5(String(this.contents)),
      writable: false
    });
  }
  return this._md5;
};

function getReleaseExt(ext){
  if(ext){
    var rExt = her.config.get('roadmap.ext' + ext);
    if(rExt){
      ext = normalizeExt(rExt);
    }
  }
  return ext;
}

function normalizeExt(ext){
  if(ext[0] !== '.'){
    ext = '.' + ext;
  }
  return ext;
}

function addHash(path, file) {
  var rExt = file.rExt;
  var qRExt = her.util.pregQuote(rExt);
  var qExt = her.util.pregQuote(file.ext);
  var hash = file.getHash();
  var connector = her.config.get('project.md5Connector', '_');
  var reg = new RegExp(qRExt + '$|' + qExt + '$', 'i');
  return path.replace(reg, '') + connector + hash + rExt;
}

function getReleasePath(file) {
  return her.util.normalize(file.release + '/' + file.relative);
}

module.exports = File.factory();
