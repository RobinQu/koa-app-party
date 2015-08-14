# koa-app-party

[![Build Status](https://travis-ci.org/RobinQu/koa-app-party.svg)](https://travis-ci.org/RobinQu/koa-app-party)


Enjoy the dark art of sub-app in koa

## Usage

### Mounting

```
var ap = require('koa-app-party');

var App1 = ap.extend(function() {
  this.use(require('./middleware/foo'));
});

var App2 = ap.extend(function() {
  this.use(require('./middleware/bar'));
});

var Root = ap.Container.extend(function() {
  this.mount('/foo', App1);
  this.mount('/bar', App2);
});
```


### Namespace chain

Namespace is a special container that can be shared across constructor calls of `ap.App` and koa contexts.

To inject dependencies into namespace, `App.design` is used to create a app subclass and define its namespace.

To learn more about namespace, visit [othiym23/node-continuation-local-storage](https://github.com/othiym23/node-continuation-local-storage).

```
var App = ap.design('myapp', function(ns) {
  ns.set('foo', 'bar');
  assert(ns.get('origin') === 'container');
});
var Container = ap.Container.design('mycontaier', function(ns) {
  ns.set('origin', 'container');
  this.use(function*() {
    this.body = this.ns.get('foo');
  });
});
```

* a new context is created at the
