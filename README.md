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


### Namespace chaining

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
  this.mount('foo', App);
  this.use(function*() {
    this.body = this.ns.get('foo');
  });
});
```

* a new context is created in the constructor call of every `App`
* if an app is mounted onto a container, in the runtime, all middlewares of this app will be run in a context that are merged from both container and app itself.
* namespace will be re-created in every request session and will be deserted after response


More examples can be found in [test/container_test.coffee](test/container_test.coffee).


## API

```
var ap = require('koa-app-party');
```

### ap

* ap.design

  Alias for `ap.App.design`

* ap.extend

  Alais for `ap.App.extend`

* ap.App

  Atomic app unit

* ap.Container

  Container app. Useful for mounting multiple atomic apps.

### App = ap.App

* App.extend(configurator)

  Create a subclass from current App. A `configurator` function will be invoked during constructor call with app instance as current context and other arguments passed to the constructor.

* App.extend(props)

  A plain object can be passed to extend the prototype of subclass. `props.init` will be called during constructor call.
  And a reference to super method (if any), is available as `this.super`.

* App.design(name, designer)

  Like `App.extend`, but `designer` will be run with the namespace instance as a single argument. `designer` is intended to modify the namespace during the constructor call.

* App.create(options)

  Create a `App` instance with options.

### var app = new App(options)

* app.listen(port, callback)

  Startup http server at local port assigned by `port`, and run callback.

* app.acceptServer(server, callback) -> Promise

  Before the call of `server.listen()`, the server instance is passed to this method to do everything you need. Return a promise to continue. Defaults to return a `Promise.resolve(true)`.

* app.inject(injector)

  Run `injector` with `namespace` and `callback` before `server.listen`. Ensure `callback` is run, or the server will never listen.


### Container = ap.Container

Subclass of `App`. Following class methods work just like the one on `App`:

* Container.create
* Container.design
* Container.extend


### var container = new ap.Container()

* container.mount(prefix, app)

  Mount an app at location of `prefix`.

* container.design(info)

  `info` is an object describing the layout of this container, such as

  ```
  {
    '/app1': App1,
    '/app2': App2
    '/': '/app1'
  }
  ```

###  Subclassing notes

* `Container.prototype.acceptServer` is pre-defined. You should call this method if you are writing an override version of `acceptServer` on a container.
* Always run `extend` or `design` to create subclasses.


## Contributor

RobinQu

## License

MIT
