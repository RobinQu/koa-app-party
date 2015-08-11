var App = require('./app');
var debug = require('catlog')('ap:container');
var mount = require('koa-mount');
var http = require('http');
var Promise = require('bluebird');
var _ = require('lodash');
var ns = require('./ns');
var Router = require('koa-router');
var mw = require('./mw');

var AppContainer = App.extend(function() {
  //sub apps
  this.subapps = [];
  //core router
  this.router = new Router();
  //apply core router first
  this.use(this.router.middleware());
});

var proto = AppContainer.prototype;

proto.compose = function (designInfo) {
  //design
  if(designInfo) {
    _.forOwn(designInfo, function (v, k) {
      if(typeof v === 'string') {//redirect
        this.router.all(k, mw.redirect(v));
      } else {//app
        var options = ns.get().get('options');
        this.mount(k, v.create(options));
      }
    }, this);
  }
};

proto.mount = function (prefix, app) {
  debug('mount');
  //redirect fix
  app.middleware.unshift(function *(next) {
    var redirect = this.redirect;
    this.redirect = function (url, alt) {
      if(url.indexOf('http') !== 0 && url.indexOf(prefix) !== 0) {
        url = prefix + url;
      }
      return redirect.call(this, url, alt);
    };
    yield next;
    this.redirect = redirect;
  });
  //mount middleware
  this.subapps.push(app);
  //namespace support
  var self = this;
  this.use(function *(next) {
    var namespace = ns.get();
    var m = mount(prefix, app);
    var ctx = Object.create(self.nsContext);
    namespace.enter(ctx);
    debug('enter ns %s', app.name);
    namespace.set('origin', app.name);
    namespace.set('name', self.name);
    namespace.set('prefix', (self.nsContext.prefix || '') + prefix);
    //setup ns of subapp, for inheritance
    app.nsContext = namespace.active;
    if(app.contextualize) {
      app.contextualize(ctx);
    }
    try {
      yield m.call(this, function *() {}.call(this));
    } catch(e) {
      e['error@context'] = ctx;
      throw e;
    } finally {
      debug('exit ns %s', app.name);
      namespace.exit(ctx);
    }
    yield next;
  });
};

proto.acceptServer = function (server, callback) {
  return Promise.each(this.subapps, function (subapp) {
    if(subapp.acceptServer) {
      if(subapp.acceptServer.length === 1) {//Promise style
        return subapp.acceptServer(server);
      } else {
        return Promise.promisify(subapp.acceptServer, subapp)(server);
      }
    }
  }).nodeify(callback);
};

proto.listen = function () {
  var srv = http.createServer(this.callback());
  var args = _.slice(arguments, 0);
  this.acceptServer(srv).then(function () {
    srv.listen.apply(srv, args);
  });
  return srv;
};

module.exports = AppContainer;
