ap = require '..'
expect = require('chai').expect

describe 'ap', ->

  it 'should export everything', ->
    expect(ap.extend).to.be.ok
    expect(ap.design).to.be.ok
    expect(ap.App).to.be.ok
    expect(ap.Container).to.be.ok
