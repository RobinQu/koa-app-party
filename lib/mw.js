var _ = require('lodash');
var mount = require('koa-mount');
var compose = require('koa-compose');


var MW = module.exports = {

  redirect: function (url) {
    var debug = require('catlog')('ap:mw:redirect');
    return function *() {
      debug('redirect %s', url);
      this.redirect(url);
    };
  },

  recursiveRedirect: function (prefix) {
    return function *(next) {
      var redirect = this.redirect;
      this.redirect = function (url, alt) {
        if(url.indexOf('http') !== 0 && url.indexOf(prefix) !== 0) {
          url = prefix + url;
        }
        return redirect.call(this, url, alt);
      };
      yield next;
      this.redirect = redirect;

    };
  },

  wrapMount: function (prefix, app) {
    return function *(next) {
      var wrapped = app._wrappedMW;
      if(!wrapped) {
        var mws = _.slice(app.middleware);
        mws.unshift(MW.recursiveRedirect(prefix));
        mws.unshift(MW.namespace(this, prefix, app));
        wrapped = app._wrappedMW = compose(mws);
      }
      var m = mount(prefix, wrapped);
      yield m.call(this, next);
    };
  },

  namespace: function (container, prefix, app) {
    var debug = require('catlog')('ap:mw:namespace');
    return function* (next) {
      debug('enter %s from %s', app.name, container.name);
      //To inherit all ascendant contexts, create a clean context from this.ns.active. Don't use container.nsContext, or all context data before entering this container will be lost
      var ctx = Object.create(this.ns.active);
      //merge two contexts
      _.extend(ctx, app.nsContext);
      this.ns.enter(ctx);
      this.ns.set('container', container);
      this.ns.set('prefix', container.prefix ? container.prefix + prefix : prefix);
      try {
        //if middlewares of other subapps of `app` are encountered, they will be runned in current active context
        //otherwise, the context will be deserted in the following middlewares of `container`
        yield next;
      } catch(e) {
        e['context@error'] = ctx;
        throw e;
      } finally {
        debug('exit');
        this.ns.exit(ctx);
      }
    };
  }

};
