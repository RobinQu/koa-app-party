var Base = require('./base');
var ns = require('./ns');
var _ = require('lodash');
var debug = require('catlog')('ap:app');
var http = require('http');
var Promise = require('bluebird');

var App = Base.extend();

App.design = function(name, configure) {
  // var debug = require('catlog')('ap:app:' + name);
  debug('design %s', name);
  var Klass = this;
  var namespace = ns.get();
  configure = configure || function () {};
  return Klass.extend(function(options) {
    //naming
    this.name = name;
    //ns
    Object.defineProperty(this.context, 'ns', {
      get: ns.get,
      configurable: false,
      enumerable: true
    });
    var self = this;
    var run = function (ctx) {
      self.nsContext = ctx;
      debug('ns setup');
      namespace.set('name', name);
      namespace.set('env', process.env.NODE_ENV || 'development');
      namespace.set('options', options);
      //by configure
      configure.call(self, namespace);
    };

    debug('create ns context');
    namespace.run(run);

  });
};

var proto = App.prototype;

proto.ns = ns.get;

//default injector. do nothing here.
proto.inject = function (inject, callback) {
  return Promise.resolve(true).nodeify(callback);
};

//defualt acceptServer
proto.acceptServer = function (srv, callback) {
  return Promise.resolve(true).nodeify(callback);
};

proto.listen = function () {
  var srv = http.createServer();
  var self = this;
  var args = _.slice(arguments, 0);
  var namespace = ns.get();
  namespace.bind(function () {
    self.inject(namespace).then(function () {
      debug('injection ok');
      self.emit('inject');
      return self.acceptServer(srv).then(function () {
        debug('accpet server ok');
        srv.on('request', self.callback());
        srv.listen.apply(srv, args);
      });
    }).catch(function (e) {
      debug(e);
      self.emit('error', e);
    });
  }, this.nsContext)();
  return srv;
};

module.exports = App;
