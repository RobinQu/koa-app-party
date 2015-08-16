var util = require('util');
var koa = require('koa');
var _ = require('lodash');
var debug = require('catlog')('ap:base');

var BaseServer = module.exports = koa;

BaseServer.run = function(conf, callback) {
  debug('run');
  var S = this;
  if(typeof conf === 'function') {
    callback = conf;
    conf = {};
  }
  var s = S.create(conf);
  s.listen(process.env.PORT || conf.web && conf.web.port || 8080, callback);
  return s;
};

BaseServer.Type = 'Base';

BaseServer.create = function (options) {
  debug('create');
  var App = this;
  return new App(options);
};

BaseServer.extend = function(props) {
  debug('extend');
  props = props || {};
  if(typeof props === 'function') {
    props = {init: props};
  }
  var Base = this;
  // console.log(Base.Type, props.init && props.init.toString());
  var Server = function Ctor() {
    // console.log(Base.Type);
    Base.apply(this, arguments);
    if(props.init) {
      debug('run init on %s', Server.Type);
      props.init.apply(this, arguments);
    }
  };
  util.inherits(Server, Base);

  var prototype = Server.prototype;
  var fnTest = /xyz/.test(function(){ 'xyz'; }) ? /\bsuper\b/ : /.*/;
  _.forOwn(props, function (src, k) {
    var parent = prototype[k];
    if(typeof parent === 'function' && typeof src === 'function' && fnTest.test(src)) {
      prototype[k] = function() {
        // Save the current parent method
        var tmp = this.super;

        // Set parent to the previous method, call, and restore
        this.super = parent;
        var res = src.apply(this, arguments);
        this.super = tmp;

        return res;
      };
    } else {
      prototype[k] = src;
    }
  });

  _.forOwn(Base, function (v, k) {
    if(typeof v === 'function' && k !== 'super_' && k.indexOf('_') !== 0) {
      Server[k] = v;
    }
  });

  return Server;
};
