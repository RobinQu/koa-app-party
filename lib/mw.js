var ns = require('./ns');
var mount = require('koa-mount');

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
    return function *(next) {
      var namespace = ns.get();
      var m = mount(prefix, app);
      var ctx = Object.create(container.nsContext);
      namespace.enter(ctx);
      debug('enter ns %s', app.name);
      namespace.set('origin', app.name);
      namespace.set('name', container.name);
      namespace.set('prefix', (container.nsContext.prefix || '') + prefix);
      //setup ns of subapp, for inheritance
      app.nsContext = namespace.active;
      if(app.namespace) {
        app.namespace(ctx);
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
    };
  }

};
