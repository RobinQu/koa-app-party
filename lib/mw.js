module.exports = {

  redirect: function (url) {
    return function *() {
      this.redirect(url);
    };
  }

};
