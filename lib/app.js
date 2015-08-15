var Base = require('./base');
var ns = require('./ns');
var _ = require('lodash');
var debug = require('catlog')('ap:app');
var http = require('http');
var Promise = require('bluebird');
var assert = require('assert');

var App = Base.extend(function (options) {
  var self = this;
  var namespace = ns.get();
  Object.defineProperty(this.context, 'ns', {
    get: ns.get,
    configurable: false,
    enumerable: true
  });
  var run = function (ctx) {
    debug('ns setup in ctor');
    self.nsContext = ctx;
    namespace.set('env', process.env.NODE_ENV || 'development');
    namespace.set('options', options);
  };
  namespace.run(run);
});

App.design = function(name, configure) {
  assert(typeof name === 'string', 'should provide name');
  debug('design %s', name);
  var Klass = this;
  var namespace = ns.get();
  configure = configure || function () {};
  return Klass.extend(function(options) {
    //naming
    this.name = name;
    var self = this;
    var run = namespace.bind(function (ctx) {
      debug('ns setup in design %s', name);
      namespace.set('name', name);
      //by configure
      configure.call(self, namespace);
    }, self.nsContext);
    run();
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
  var ctx = self.nsContext;
  namespace.enter(ctx);
  self.inject(namespace).then(function () {
    debug('injection ok');
    self.emit('inject');
    return self.acceptServer(srv).then(function () {
      debug('accpet server ok');
      srv.on('request', namespace.bind(self.callback()));
      srv.listen.apply(srv, args);
    });
  }).catch(function (e) {
    debug(e);
    e['error@context'] = ctx;
    self.emit('error', e);
  });
  namespace.exit(ctx);
  return srv;
};

module.exports = App;
