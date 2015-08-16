var App = require('./app');
var debug = require('catlog')('ap:container');
// var http = require('http');
var Promise = require('bluebird');
var _ = require('lodash');
var ns = require('./ns');
var Router = require('koa-router');
var mw = require('./mw');

var proto = {};

proto.init = function() {
  //sub apps
  this.subapps = [];
  //core router
  this.router = new Router();
  //design info
  this.design = {};
  //apply core router first
  this.use(this.router.middleware());
};

proto.compose = function (designInfo) {
  debug('compose');
  //design
  if(designInfo) {
    _.forOwn(designInfo, function (v, k) {
      if(typeof v === 'string') {//redirect
        this.router.all(k, mw.redirect(v));
      } else if(v instanceof App) {//app
        this.mount(k, v);
      } else {
        var options = ns.get().get('options');
        this.mount(k, v.create(options));
      }
    }, this);
  }
};

proto.mount = function (prefix, app) {
  this.subapps.push(app);
  this.use(mw.wrapMount(prefix, app));
};

proto.bootstrap = function (srv, callback) {
  var _super = this.super;
  var self = this;
  return Promise.each(this.subapps, function (subapp) {
    return subapp.bootstrap(srv);
  }).then(function () {
    return _super.call(self, srv);
  }).nodeify(callback);
};

var AppContainer = App.extend(proto);

AppContainer.Type = 'Container';

module.exports = AppContainer;
