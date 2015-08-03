var util = require('util');
var koa = require('koa');
var mount = require('koa-mount');
var _ = require('lodash');
var debug = require('debug')('party:base');

var BaseServer = module.exports = koa;

BaseServer.run = function(conf, callback) {
  debug('run');
  var S = this;
  var s = new S(conf);
  s.listen(conf.web.port, callback);
  return s;
};

BaseServer.extend = function(name, ctor) {
  if(typeof name === 'function') {
    ctor = name;
    name = 'app';
  }
  debug('extend for %s', name);
  var Base = this;
  var Server = function(options) {
    Base.call(this, options);
    this.name = name;
    //ENV
    this.context.ENV = this.env = process.env.NODE_ENV || 'development';
    //shared config
    this.context.conf = options;
    //mixin
    this.mixin = {};
    //put ctor call at last
    ctor.call(this, options);
  };
  util.inherits(Server, Base);
  Server.run = Base.run;
  Server.extend = Base.extend;
  return Server;
};


BaseServer.prototype.extend = function (mixin) {
  var name = this.name;
  debug('mixin %s', name);
  this.mixin[name] = _.extend(this.mixin[name] || {}, mixin);
};


BaseServer.prototype.mount = function (prefix, app) {
  debug('mount');
  //apply mixin
  this.context = _.extend(this.context, app.mixin);
  //mount middleware
  this.use(mount(prefix, app));
};
