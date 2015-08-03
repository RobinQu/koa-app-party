var util = require('util');
var koa = require('koa');
var mount = require('koa-mount');

var BaseServer = module.exports = koa;

BaseServer.run = function(conf, callback) {
  var S = this;
  var s = new S(conf);
  s.listen(conf.web.port, callback);
  return s;
};

BaseServer.extend = function(ctor) {
  var Base = this;
  var Server = function(options) {
    Base.call(this, options);
    ctor.call(this, options);
    this.mount = function() {
      this.use(mount.apply(null, arguments));
    };
    //ENV
    this.context.ENV = this.env = process.env.NODE_ENV || 'development';
    //shared config
    this.context.conf = options;
  };
  util.inherits(Server, Base);
  Server.run = Base.run;
  Server.extend = Base.extend;
  return Server;
};
