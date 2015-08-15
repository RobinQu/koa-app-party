expect = require('chai').expect
sinon = require('sinon')
request = require('supertest')
ap = require('..')


makeApp = (name)->
  ap.App.extend(->
      this.use(->
        this.body = name
        yield return
      )
    ).create()

describe 'Container', ->

  describe 'create', ->
    it 'should have class methods', ->
      expect(ap.Container.extend).to.be.ok
      expect(ap.Container.create).to.be.ok

    it 'should create with default members', ->
      app = ap.Container.create()
      expect(app.subapps).to.deep.equal([])
      expect(app.router && app.router.register).to.be.ok
      expect(app.design).to.deep.equal({})
      expect(app.mount).to.be.ok
      expect(app.compose).to.be.ok
      expect(app.acceptServer).to.be.ok
      expect(app.middleware.length).to.equal(1)
      expect(app instanceof ap.App).to.be.ok
      expect(app.constructor).to.equal(ap.Container)

  describe 'mount', ->
    it 'should mount app at given path', (done)->
      root = ap.Container.create()
      root.mount('/app1', makeApp('app1'))
      request(root.listen())
      .get('/app1')
      .expect(200)
      .expect('app1')
      .end(done)

    it 'should inherit namespace', (done)->
      app = ap.design('app', (ns)->
        ns.set('foo', 'bar')
        this.use(->
          this.body =
            foo: this.ns.get('foo'),
            hello: this.ns.get('hello')
          yield return
          )
        ).create()
      root = ap.Container.design('root', (ns)->
        ns.set('hello', 'world')
        ).create()
      root.mount('/somewhere', app)
      request(root.listen())
      .get('/somewhere')
      .type('json')
      .expect(200)
      .expect((res)->
        expect(res.body).to.deep.equal({
          foo: 'bar',
          hello: 'world'
          })
        )
      .end(done)

  describe 'design', ->
    it 'should assign redirect route', (done)->
      app = ap.Container.create()
      app.use((next)->
          if this.path.indexOf('/foo')
            this.body = 'foo'
          else
            yield next
        )
      app.compose(
        '/': '/foo'
      )
      request(app.listen())
      .get('/')
      .expect(302)
      .end(done)

    it 'should mount app at given path', (done)->
      root = ap.Container.extend(->
        this.compose(
          '/app1': makeApp('app1'),
          '/app2': makeApp('app2'),
          '/': '/app1'
          )
        ).create()
      request(root.listen())
      .get('/')
      .expect(302)
      .end(done)
