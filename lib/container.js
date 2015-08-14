var App = require('./app');
var debug = require('catlog')('ap:container');
// var http = require('http');
var Promise = require('bluebird');
var _ = require('lodash');
var ns = require('./ns');
var Router = require('koa-router');
var mw = require('./mw');
var mount = require('koa-mount');
var compose = require('koa-compose');

var AppContainer = App.extend(function() {
  //sub apps
  this.subapps = [];
  //core router
  this.router = new Router();
  //design info
  this.design = {};
  //apply core router first
  this.use(this.router.middleware());
});

var proto = AppContainer.prototype;

proto.compose = function (designInfo) {
  debug('compose');
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
  var _mw = _.slice(app.middleware, 0);
  _mw.unshift(mw.namespace(this, prefix, app));
  this.use(mount(prefix, compose(_mw)));
};

proto.acceptServer = function (server, callback) {
  debug('accept srv');
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

module.exports = AppContainer;
