const cookie = require('cookie')
const cookieSignature = require('cookie-signature')
const Felid = require('felid')
const injectar = require('injectar')
const cookiePlugin = require('../src')

describe('parse cookies', () => {
  test('Should parse request cookies', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin)
    instance.get('/test', (req, res) => {
      expect(req.cookies.foo).toBe('bar')
      res.send('test')
      done()
    })
  
    injectar(instance.lookup())
      .get('/test')
      .header('cookie', 'foo=bar')
      .end()
  })
})

describe('set cookies', () => {
  test('Should set correct cookie', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin)
    instance.get('/test', (req, res) => {
      res.cookie('foo', 'bar').send('test')
    })
  
    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.headers['set-cookie']).toMatch('foo=bar')
        done()
      })
  })
  
  test('Should set multiple cookies with the same name', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin)
    instance.get('/test', (req, res) => {
      res.cookie('foo', 'bar').cookie('foo', 'baz').send('test')
    })
  
    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        const cookies = res.headers['set-cookie']
        expect(Array.isArray(cookies)).toBe(true)
        expect(cookies[0]).toMatch('foo=bar')
        expect(cookies[1]).toMatch('foo=baz')
        done()
      })
  })

  test('Should set correct cookies', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin)
    instance.get('/test', (req, res) => {
      res.cookies({
        foo: 'bar',
        hello: 'felid',
        multi: ['x', 'y']
      }).send('test')
    })
  
    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        const cookies = res.headers['set-cookie']
        expect(Array.isArray(cookies)).toBe(true)
        expect(cookies[0]).toMatch('foo=bar')
        expect(cookies[1]).toMatch('hello=felid')
        expect(cookies[2]).toMatch('multi=x')
        expect(cookies[3]).toMatch('multi=y')
        done()
      })
  })
  
  test('Should set correct cookies using combined methods', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin)
    instance.get('/test', (req, res) => {
      res.cookie('foo', 'bar')
        .cookies({
          foo: 'baz',
          hello: 'felid'
        })
        .send('test')
    })
  
    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        const cookies = res.headers['set-cookie']
        expect(Array.isArray(cookies)).toBe(true)
        expect(cookies[0]).toMatch('foo=bar')
        expect(cookies[1]).toMatch('foo=baz')
        expect(cookies[2]).toMatch('hello=felid')
        done()
      })
  })
})

describe('sign cookies', () => {
  const secret = 'key'
  test('Should sign cookies correctly', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin, { secret })
    instance.get('/test', (req, res) => {
      res.cookie('foo', 'bar').send('test')
    })
  
    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        const cookies = cookie.parse(res.headers['set-cookie'])
        expect(cookieSignature.unsign(cookies.foo, secret)).toBe('bar')
        done()
      })
  })

  test('Should automatically unsign cookies if `unsign` is set to true', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin, {
      secret,
      unsign: true
    })
    instance.get('/test', (req, res) => {
      expect(req.cookies.foo).toBe('bar')
      res.send('test')
      done()
    })
  
    injectar(instance.lookup())
      .get('/test')
      .header('cookie', cookie.serialize('foo', cookieSignature.sign('bar', secret)))
      .end()
  })

  test('Should unsign cookies correctly', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin, {
      secret
    })
    instance.get('/test', (req, res) => {
      expect(req.cookies.foo).toBe(cookieSignature.sign('bar', secret))
      expect(req.unsign('foo')).toBe('bar')
      expect(req.cookies.foo).toBe('bar')
      res.send('test')
      done()
    })
  
    injectar(instance.lookup())
      .get('/test')
      .header('cookie', cookie.serialize('foo', cookieSignature.sign('bar', secret)))
      .end()
  })

  test('Should unsign cookies correctly with given secret', (done) => {
    const anotherSecret = 'another key'
    const instance = new Felid()
    instance.plugin(cookiePlugin, {
      secret
    })
    instance.get('/test', (req, res) => {
      expect(req.unsign('foo', anotherSecret)).toBe('bar')
      res.send('test')
      done()
    })
  
    injectar(instance.lookup())
      .get('/test')
      .header('cookie', cookie.serialize('foo', cookieSignature.sign('bar', anotherSecret)))
      .end()
  })
})

describe('options', () => {
  test('Should set `HttpOnly` by default', async () => {
    const instance = new Felid()
    instance.plugin(cookiePlugin)
    instance.get('/test', (req, res) => {
      res.cookie('foo', 'bar').send('test')
    })
    instance.get('/test1', (req, res) => {
      res.cookie('foo', 'bar', {}).send('test')
    })
  
    const inject = injectar(instance.lookup())
    let res
    res = await inject.get('/test').end()
    expect(res.headers['set-cookie']).toMatch('HttpOnly')
    res = await inject.get('/test1').end()
    expect(res.headers['set-cookie']).toMatch('HttpOnly')
  })
  
  test('Should set correct cookie according to options', (done) => {
    const instance = new Felid()
    instance.plugin(cookiePlugin)
    instance.get('/test', (req, res) => {
      res.cookie('foo', 'bar', {
        domain: '/',
        maxAge: 30,
        path: '/'
      }).send('test')
    })
  
    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        const cookies = cookie.parse(res.headers['set-cookie'])
        expect(cookies['Domain']).toBe('/')
        expect(cookies['Max-Age']).toBe('30')
        expect(cookies['Path']).toBe('/')
        done()
      })
  })
  
  test('Should set correct cookie according to global options and specific options', async () => {
    const instance = new Felid()
    instance.plugin(cookiePlugin, {
      domain: '/',
      httpOnly: false,
      path: '/'
    })
    instance.get('/test', (req, res) => {
      res.cookie('foo', 'bar', {
        path: '/path'
      }).send('test')
    })
    instance.get('/test1', (req, res) => {
      res.cookie('foo', 'bar', {
        httpOnly: true
      }).send('test')
    })
  
    const inject = injectar(instance.lookup())
    let res, cookies
    res = await inject.get('/test').end()
    cookies = cookie.parse(res.headers['set-cookie'])
    expect(res.headers['set-cookie']).not.toMatch('HttpOnly')
    expect(cookies['Domain']).toBe('/')
    expect(cookies['Path']).toBe('/path')
    res = await inject.get('/test1').end()
    cookies = cookie.parse(res.headers['set-cookie'])
    expect(res.headers['set-cookie']).toMatch('HttpOnly')
    expect(cookies['Domain']).toBe('/')
    expect(cookies['Path']).toBe('/')
  })
  
  test('Should pass options to `cookie.parse` correctly', (done) => {
    function decoder () {
      return 'test'
    }
    const instance = new Felid()
    instance.plugin(cookiePlugin, {
      parseOptions: {
        decode: decoder
      }
    })
    instance.get('/test', (req, res) => {
      expect(req.cookies.foo).toBe('test')
      res.send('test')
      done()
    })
  
    injectar(instance.lookup())
      .get('/test')
      .header('cookie', 'foo=bar')
      .end()
  })
  
  test('Should set custom decorator property name', (done) => {
    const secret = 'key'
    const instance = new Felid()
    instance.plugin(cookiePlugin, {
      secret,
      decorator: {
        reqGetCookie: 'getCookie',
        unsignCookie: 'unsignCookie',
        resSetCookie: 'setCookie',
        resSetCookies: 'setCookies'
      }
    })
    instance.get('/test', (req, res) => {
      expect(req.getCookie.foo).toBe(cookieSignature.sign('bar', secret))
      expect(req.unsignCookie('foo')).toBe('bar')
      res.setCookie('hello', 'felid')
      res.setCookies({
        foo: 'baz'
      })
      res.send('test')
    })
  
    injectar(instance.lookup())
      .get('/test')
      .header('cookie', cookie.serialize('foo', cookieSignature.sign('bar', secret)))
      .end((err, res) => {
        expect(err).toBe(null)
        const cookies = res.headers['set-cookie']
        expect(Array.isArray(cookies)).toBe(true)
        expect(cookies[0]).toMatch('hello=felid')
        expect(cookies[1]).toMatch('foo=baz')
        done()
      })
  })
})
