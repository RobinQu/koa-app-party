var cls = require('continuation-local-storage');

module.exports = {
  get: function (name) {
    name = name || 'ap_store';
    return cls.getNamespace(name) || cls.createNamespace(name);
  }
};
