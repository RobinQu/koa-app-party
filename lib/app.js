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
  this.context.ENV = this.context.env = process.env.NODE_ENV || 'development';
  var run = function (ctx) {
    debug('ns setup in ctor');
    self.nsContext = ctx;
    namespace.set('env', process.env.NODE_ENV || 'development');
    namespace.set('options', options);
  };
  namespace.run(run);
});

App.Type = 'app';

App.design = function(name, configure) {
  assert(typeof name === 'string', 'should provide name');
  debug('design %s', name);
  var Klass = this;
  var namespace = ns.get();
  return Klass.extend(function() {
    //naming
    this.name = name;
    var self = this;
    var run = namespace.bind(function () {
      debug('ns setup in design %s', name);
      namespace.set('name', name);
      //by configure
      if(configure) {
        configure.call(self, namespace);
      }
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

proto.bootstrap = function (srv, callback) {
  var namespace = ns.get();
  var self = this;
  var ctx = self.nsContext;
  if(typeof srv === 'function') {//create server if not given
    debug('new server in bootstrap');
    callback = srv;
    srv = http.createServer();
  }
  if(self.bootstrapped) {
    return Promise.resolve(namespace).nodeify(callback);
  }
  namespace.enter(ctx);
  var inject = function () {
    if(self.inject.length === 1) {//promise style
      return Promise.try(function () {
        return self.inject(namespace);
      });
    }
    return Promise.promisify(self.inject, self)(namespace);
  };
  return inject().then(function () {
    debug('injection ok');
    self.emit('inject');
    return self.acceptServer(srv).then(function () {
      debug('accpet server ok');
      debug('bootstrap done on %s', self.name);
      self.bootstrapped = true;
      return namespace;
    });
  }).catch(function (e) {
    e['error@context'] = ctx;
    throw e;
  }).finally(function () {
    namespace.exit(ctx);
  }).nodeify(callback);
};

proto.listen = function () {
  var self = this;
  var srv = http.createServer();
  var args = _.slice(arguments, 0);
  this.bootstrap(srv, function (e) {
    if(e) {
      debug(e);
      self.emit('error', e);
    } else {
      debug('listen');
      srv.on('request', ns.get().bind(self.callback(), self.nsContext));
      srv.listen.apply(srv, args);
    }
  });
  return srv;
};

module.exports = App;
