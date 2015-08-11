var util = require('util');
var koa = require('koa');
var _ = require('lodash');
var debug = require('catlog')('ap:base');

var BaseServer = module.exports = koa;

BaseServer.run = function(conf, callback) {
  debug('run');
  var S = this;
  var s = S.create(conf);
  s.listen(process.env.PORT || conf.web && conf.web.port || 8080, callback);
  return s;
};

BaseServer.create = function (options) {
  debug('create');
  var App = this;
  return new App(options);
};

BaseServer.extend = function(ctor) {
  debug('extend');
  var Base = this;
  var Server = function() {
    Base.apply(this, arguments);
    if(ctor) {
      ctor.apply(this, arguments);
    }
  };
  util.inherits(Server, Base);
  _.forOwn(Base, function (v, k) {
    if(typeof v === 'function') {
      Server[k] = v;
    }
  });
  return Server;
};
