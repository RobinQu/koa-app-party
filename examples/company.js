var ap = require('..');

var Jack = ap.design('jack', function (ns) {
  console.log(ns.active);
  ns.set('role', 'worker');
  this.use(function *() {
    this.body = {
      container: this.ns.get('container'),
      app: this.ns.get('name'),
      role: this.ns.get('role')
    };
  });
});

var Charlie = ap.design('charlie', function (ns) {
  console.log(ns.active);
  ns.set('role', 'manager');
  this.use(function *() {
    this.body = {
      container: this.ns.get('container'),
      app: this.ns.get('name'),
      role: this.ns.get('role')
    };
  });
});


var App = ap.Container.design('app', function (ns) {
  ns.set('company', 'MegaTrans');
  this.mount('/worker', Jack.create());
  this.mount('/manager', Charlie.create());
  this.use(function *() {
    console.log(ns.active);
    if(this.path === '/') {
      this.body = {
        company: this.ns.get('company'),
        role: this.ns.get('role')
      };
    }
  });
});

App.run(function () {
  console.log('company is up and running');
});
