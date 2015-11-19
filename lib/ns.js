var cls = require('continuation-local-storage');
var ns = cls.createNamespace('app-store');

require('cls-bluebird')(ns);

module.exports = {
  get: function () {
    return ns;
  }
};
