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
            prefix: this.ns.get('prefix')
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
          prefix: '/somewhere'
          })
        )
      .end(done)

    it 'should fix redirects', (done)->
      app1 = ap.extend(->
        this.use(->
          if this.path is '/go'
            this.redirect('/newplace')
          yield return
          )
        ).create()
      root = ap.Container.extend(->
        this.mount('/app1', app1)
        ).create()
      request(root.listen())
      .get('/app1/go')
      .expect(302)
      .expect('location', '/app1/newplace')
      .end(done)

    describe 'nested', ->
      app1 = ap.Container.design('app1', (ns)->
        ns.set('app1', 'abcd')
        ns.set('common', 'a')
        this.mount('/sub1', makeApp('sub1'))
        ).create()
      app2 = ap.Container.design('app2', (ns)->
        ns.set('app2', 'efgh')
        ns.set('common', 'b')
        this.mount('/sub2', makeApp('sub2'))
        this.use(->
          this.body = this.ns.get('common')
          yield return
          )
        ).create()
      app3 = ap.Container.design('app3', (ns)->
        ns.set('app3', 'ijkl')
        ns.set('override1', '2')
        ns.set('common', 'c')
        this.compose(
          '/go': '/sub3',
          '/sub3': ap.design('sub3', (ns)->
            ns.set('sub3', 'sub3')
            ns.set('override2', '3')
            this.use(->
              if this.path is '/place1'
                this.redirect('/place2')
              else
                this.body =
                  common: this.ns.get('common')
                  root: this.ns.get('root')
                  sub3: this.ns.get('sub3')
                  app3: this.ns.get('app3')
                  override1: this.ns.get('override1')
                  override2: this.ns.get('override2')
              yield return
              )
            )
        )
        this.use(->
          this.body = this.ns.get('common')
          yield return
          )
        ).create()
      root = ap.Container.design('root', (ns)->
        ns.set('override1', '1')
        ns.set('override2', '2')
        ns.set('root', 'haha')
        this.mount('/app1', app1)
        this.mount('/app2', app2)
        this.mount('/app3', app3)
        ).create()


      it 'should support nested mount', (done)->
        request(root.listen())
        .get('/app1/sub1')
        .expect(200)
        .expect('sub1')
        .end(done)

      it 'should concat prefixes in redirection', (done)->
        request(root.listen())
        .get('/app3/sub3/place1')
        .expect(302)
        .expect('location', '/app3/sub3/place2')
        .end(done)

      it 'should inheirt from all ascendants', (done)->
        request(root.listen())
        .get('/app3/sub3/value')
        .type('json')
        .expect(200)
        .expect((res)->
          v = res.body
          expect(v.root).to.equal('haha')
          expect(v.sub3).to.equal('sub3')
          expect(v.app3).to.equal('ijkl')
          expect(v.override1).to.equal('2')
          expect(v.override2).to.equal('3')
          expect(v.common).to.equal('c')
          )
        .end(done)

      it 'should be isolated namespace', (done)->
        request(root.listen())
        .get('/app2/abc')
        .expect('b')
        .end((e)->
          done(e) if e
          request(root.listen())
          .get('/app3/abc')
          .expect('c')
          .end(done)
          )

  describe 'acceptServer', ->

    it 'should call acceptServer of subapps', (done)->
      app1 = makeApp('app1')
      app1.acceptServer = sinon.stub()
      app1.acceptServer.callsArg(1)
      app2 = makeApp('app2')
      app2.acceptServer = sinon.stub()
      app2.acceptServer.callsArg(1)
      root = ap.Container.design('root', ->
        this.compose(
          '/': '/app1'
          '/app1': app1
          '/app2': app2
        )
        ).create()
      expect(root.subapps).to.be.ok
      expect(root.subapps.length).to.equal(2)
      root.listen(->
        expect(app1.acceptServer.firstCall.args[0]).to.equal(this)
        expect(app1.acceptServer.calledOnce).to.be.true
        expect(app2.acceptServer.firstCall.args[0]).to.equal(this)
        expect(app2.acceptServer.calledOnce).to.be.true
        this.close(done)
        )



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
      .expect('location', '/foo')
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
      .expect('location', '/app1')
      .end(done)
