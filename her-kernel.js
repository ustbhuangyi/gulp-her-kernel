/**
 * her-kernel
 */
var her = module.exports = {};

//oo
Function.prototype.derive = function(constructor, proto){
  if(typeof constructor === 'object'){
    proto = constructor;
    constructor = proto.constructor || function(){};
    delete proto.constructor;
  }
  var parent = this;
  var fn = function(){
    parent.apply(this, arguments);
    constructor.apply(this, arguments);
  };
  var tmp = function(){};
  tmp.prototype = parent.prototype;
  var fp = new tmp();
  var cp = constructor.prototype;
  var key;
  for(key in cp){
    if(cp.hasOwnProperty(key)){
      fp[key] = cp[key];
    }
  }
  proto = proto || {};
  for(key in proto){
    if(proto.hasOwnProperty(key)){
      fp[key] = proto[key];
    }
  }
  fp.constructor = constructor.prototype.constructor;
  fn.prototype = fp;
  return fn;
};

//factory
Function.prototype.factory = function(){
  var clazz = this;
  function F(args){
    clazz.apply(this, args);
  }
  F.prototype = clazz.prototype;
  return function(){
    return new F(arguments);
  };
};

//register global variable
Object.defineProperty(global, 'her', {
  enumerable : true,
  writable : false,
  value : her
});

her.util = require('./lib/util.js');

her.project = require('./lib/project.js');

her.uri = require('./lib/uri.js');

her.config = require('./lib/config.js');

her.file = require('./lib/file.js');
