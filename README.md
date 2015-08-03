# AppParty

Enjoy the dark art of sub-app in koa

## Usage

```
var ap = require('koa-app-party');
var AppFoo = ap.extend(function(options) {
  this.extend({foo: 'nice'});

  this.use(function*() {
    //my foo middleware
  });
});

var AppBar = ap.extend(function(options) {
  this.extend({bar: 'bad'});

  this.use(function*() {
    //my bar middleware
  });
});


var Root = ap.extend(function(options) {
  this.mount('/foo', new AppFoo());
  this.mount('/bar', new AppBar());
});

Root.run({ key: 'value' }, function () {
  console.log('app is up and running');
});
```
