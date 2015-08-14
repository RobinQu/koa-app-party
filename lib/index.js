var App = require('./app');

module.exports = {
  extend: App.extend.bind(App),
  design: App.design.bind(App),
  App: App,
  Container: require('./container')
};
