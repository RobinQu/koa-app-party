var _ = require('lodash');

module.exports = {

  redirect: function (url) {
    var debug = require('catlog')('ap:mw:redirect');
    return function *() {
      debug('redirect %s', url);
      this.redirect(url);
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
