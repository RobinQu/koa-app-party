expect = require('chai').expect
sinon = require('sinon')

describe 'Base', ->

  Base = require '../lib/base'

  it 'should create', ->
    app = Base.create()
    expect(app instanceof require('koa')).to.be.true

  describe 'run', ->

    it 'should run with options', ->
      stub = sinon.stub(Base, 'create')
      stub.returns({listen: sinon.stub()})
      app = Base.run(foo: 'bar')
      expect(stub.calledOnce).to.be.ok
      expect(stub.firstCall.args[0]).to.deep.equal(foo: 'bar')
      stub.restore()

    it 'should run callback with options', ->
      cb = sinon.spy()
      app = Base.run(foo: 'bar', cb)
      setTimeout ->
          expect(cb.calledOnce).to.be.true
        , 100

    it 'should run callback without options', ->
      cb = sinon.spy()
      app = Base.run(cb)
      setTimeout ->
          expect(cb.calledOnce).to.be.true
        , 100


  describe 'extend', ->

    it 'should create a subclass', ->
      App = Base.extend()
      app = new App()
      expect(app instanceof Base).to.be.true
      expect(app.constructor).to.equal(App)
      expect(App.super_).to.equal(Base)
      App2 = App.extend()
      app2 = new App2()
      expect(app2 instanceof Base).to.be.true
      expect(app2 instanceof App).to.be.true
      expect(app2 instanceof App2).to.be.true
      expect(App2.super_).to.equal(App)

    it 'should call configurator', ->
      cfg = sinon.spy()
      App = Base.extend(cfg)
      app = App.create(foo: 'bar')
      expect(cfg.calledOnce).to.be.true
      expect(cfg.firstCall.thisValue).to.equal(app)
      expect(cfg.firstCall.args[0]).to.deep.equal(foo: 'bar')

    it 'should copy class methods', ->
      App = Base.extend()
      App.prop1 = 'foobar'
      App.method1 = ->
      BetterApp = App.extend()
      BetterApp.method2 = ->
      BestApp = BetterApp.extend()
      expect(BestApp.method1).to.be.ok
      expect(BestApp.method1).to.equal(App.method1)
      expect(BetterApp.prop1).not.to.be.ok
      expect(BetterApp.method2).to.be.ok
      expect(BestApp.method2).to.equal(BetterApp.method2)

    it 'should extend prototype if props are passed', ->
      app = Base.extend(
        foo: ->
        bar: ->
      ).create()
      expect(typeof app.foo).to.equal('function')
      expect(typeof app.bar).to.equal('function')

    it 'should override super methods', ->
      App = Base.extend(
        foo: -> 'foo'
      )
      App2 = App.extend(
        foo: -> 'bar'
      )
      app = App2.create()
      expect(app.foo()).to.equal('bar')

    it 'should have a reference to super method', ->
        App = Base.extend(
          foo: -> 'foo'
        )
        App2 = App.extend(
          foo: -> this.super() + 'bar'
        )
        app = App2.create()
        expect(app.foo()).to.equal('foobar')
