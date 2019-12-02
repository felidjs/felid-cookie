const cookie = require('cookie')
const cookieSignature = require('cookie-signature')

function parseReqCookie (decoratorKey, options, secret) {
  return function (req, res) {
    const cookieHeader = req.header('cookie')
    if (cookieHeader) {
      const cookies = cookie.parse(cookieHeader, options)
      if (secret) {
        for (const key in cookies) {
          cookies[key] = cookieSignature.unsign(cookies[key], secret)
        }
      }
      req[decoratorKey] = cookies
    }
  }
}

const defaultDecoratorKeys = {
  reqGetCookie: 'cookies',
  unsignCookie: 'unsign',
  resSetCookie: 'cookie',
  resSetCookies: 'cookies'
}

function plugin (felid, options) {
  const rootOptions = {
    httpOnly: true,
    unsign: false,
    ...options
  }
  const decoratorKeys = {
    ...defaultDecoratorKeys,
    ...rootOptions.decorator
  }
  felid.decorateRequest(decoratorKeys.reqGetCookie, {})
  felid.decorateRequest(decoratorKeys.unsignCookie, unsignCookie)
  felid.decorateResponse(decoratorKeys.resSetCookie, resSetCookie)
  felid.decorateResponse(decoratorKeys.resSetCookies, resSetCookies)

  felid.use(parseReqCookie(decoratorKeys.reqGetCookie, rootOptions.parseOptions, rootOptions.unsign ? rootOptions.secret : undefined))

  function unsignCookie (key, secret) {
    const value = cookieSignature.unsign(this[decoratorKeys.reqGetCookie][key], secret || rootOptions.secret)
    this[decoratorKeys.reqGetCookie][key] = value
    return value
  }

  function resSetCookie (key, value, options) {
    const serialized = cookie.serialize(key,
      rootOptions.secret ? cookieSignature.sign(value, rootOptions.secret) : value,
      options ? { ...rootOptions, ...options } : rootOptions)
    let headers = this.getHeader('set-cookie')
    if (!headers) {
      this.setHeader('set-cookie', serialized)
      return this
    }
    if (typeof headers === 'string') {
      headers = [headers]
    }
    headers.push(serialized)
    this.setHeader('set-cookie', headers)
    return this
  }

  function resSetCookies (cookies, options) {
    for (const key in cookies) {
      const value = cookies[key]
      if (Array.isArray(value)) {
        value.forEach(v => {
          resSetCookie.call(this, key, v, options)
        })
      } else {
        resSetCookie.call(this, key, value, options)
      }
    }
    return this
  }
}

module.exports = plugin
