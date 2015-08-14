ap = require '..'
expect = require('chai').expect
request = require('supertest')
Promise = require('bluebird')
sinon = require 'sinon'

describe 'App', ->

  App = ap.App

  describe 'design', ->
    it 'should delcare members on app', ->
      app = App.design('superman').create()
      expect((typeof app.ns) is 'function').to.be.true
      ns = app.ns()
      expect(ns.set && ns.get).to.be.ok
      expect(app.name).to.equal('superman')
      expect(app.inject).to.be.ok
      expect(app.acceptServer).to.be.ok
      expect(app.listen).to.be.ok

    it 'should configure namespace', (done)->
      obj =
        foo: 'bar',
        carl: 'cow'
      MyApp = App.design('spiderman', (ns)->
        expect(ns).to.be.ok
        ns.set('obj', obj)
        ns.set('bar', 'foo')
        )
      app = MyApp.create()
      app.on('error', done)
      app.use((next)->
        this.ns.set('foo', 'bar')
        this.ns.set('bar', 'bar')
        yield next;
        )
      app.use(()->
        expect(this.ns).to.be.ok
        expect(this.ns.get('bar')).to.equal('bar')
        expect(this.ns.get('foo')).to.equal('bar')
        this.body = this.ns.get('obj')
        yield return
        )
      request(app.listen()).get('/')
      .expect(200)
      .type('json')
      .expect((res)->
        expect(res.body).to.deep.equal(obj)
        )
      .end(done)

    it 'should have some default values in namespace', (done)->
      app = App.design('hulk').create()
      app.use(->
        this.body = {
          env: this.ns.get('env'),
          name: this.ns.get('name')
        };
        yield return
        )
      request(app.listen())
      .get('/')
      .expect(200)
      .expect((res)->
        r = res.body
        expect(r.env).to.equal('test')
        expect(r.name).to.equal('hulk')
        )
      .end(done)

  describe 'inject', ->
    it 'should inject on listen', (done)->
      app = App.design('antman').create()
      sinon.stub(app, 'inject', Promise.method((ns)->
        expect(ns).to.be.ok
        ns.set('inject', 'awesome')
        ))
      app.use(->
        this.body = {result: this.ns.get('inject')}
        yield return
        )
      request(app.listen())
      .get('/')
      .type('json')
      .expect((res)->
        expect(res.body.result).to.equal('awesome');
        )
      .end(done)

    it 'should emit inject event', (done)->
      app = App.design('antman').create()
      injectCb = sinon.spy()
      app.on('inject', injectCb)
      app.listen(->
        expect(injectCb.calledOnce).to.be.true
        done()
        )
      app.on('error', done)

    it 'should throw error if something goes wrong during injection', (done)->
      app = App.design('ironman').create()
      errorCb = sinon.spy()
      app.on('error', (e)->
        expect(e).to.be.ok
        ctx = app.ns().fromException(e)
        expect(ctx).to.be.ok
        expect(ctx.name).to.equal('ironman')
        done()
        )
      sinon.stub(app, 'inject', Promise.method((ns)->
        throw new Error('boom')
        ))
      app.listen(->
        done(new Error('should not run here'))
        )
