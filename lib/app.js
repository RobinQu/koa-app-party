var Base = require('./base');
var ns = require('./ns');

var App = Base.extend();

App.design = function(name, configure) {
  var debug = require('catlog')('ap:app:' + name);
  var Klass = this;
  var namespace = ns.get();
  return Klass.extend(function(options) {
    //naming
    this.name = name;
    //ns
    debug('define ns');
    Object.defineProperty(this.context, 'ns', {
      get: ns.get,
      configurable: false,
      enumerable: true
    });
    var self = this;
    namespace.run(function (ctx) {
      self.nsContext = ctx;
      debug('ns setup');
      namespace.set('env', process.env.NODE_ENV || 'development');
      namespace.set('options', options);
      //configure
      if(configure) {
        configure.call(self, namespace);
      }
    });
    var _callback = this.callback.bind(this);
    this.callback = function () {
      debug('hack callback %s', name);
      var cb = _callback();
      return namespace.bind(cb, self.nsContext);
    };

  });

};

module.exports = App;
