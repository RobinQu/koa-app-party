var ap = require('..');

var Jack = ap.design('jack', function (ns) {
  console.log('j', ns.active);
  ns.set('role', 'worker');
  this.use(function *() {
    console.log('j', this.ns.active, this.ns._set);
    this.body = {
      prefix: this.ns.get('prefix'),
      app: this.ns.get('name'),
      role: this.ns.get('role')
    };
  });
});

var Charlie = ap.design('charlie', function (ns) {
  console.log('c', ns.active);
  ns.set('role', 'manager');
  this.use(function *() {
    console.log('c', this.ns.active, this.ns._set);
    this.body = {
      prefix: this.ns.get('prefix'),
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
    console.log(this.ns.active, this.ns._set);
    if(this.path === '/') {
      this.body = {
        prefix: this.ns.get('prefix'),
        company: this.ns.get('company'),
        role: this.ns.get('role')
      };
    }
  });
});

App.run(function () {
  console.log('company is up and running');
});
