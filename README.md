# felid-cookie

[![npm version](https://img.shields.io/npm/v/felid-cookie.svg)](https://www.npmjs.com/package/felid-cookie) [![Build Status](https://travis-ci.com/felidjs/felid-cookie.svg?branch=master)](https://travis-ci.com/felidjs/felid-cookie) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A [Felid](https://github.com/felidjs/felid) plugin that provides support for cookies.

## Install

```bash
npm install felid-cookie
```

or

```bash
yarn add felid-cookie
```

## Usage

```javascript
const Felid = require('felid')
const cookie = require('felid-cookie')

const app = new Felid()
app.plugin(cookie, options)

app.get('/', (req, res) => {
  const cookies = req.cookies              // cookies from client
  req.unsign('signed cookie')              // unsign the request cookie
  res.cookie('cookie key', 'cookie value') // set a single cookie pair
  res.cookies({ foo: 'bar' })              // set cookies
})
```

## Options

- **secret** *String*: The default secret key for cookies signature. If a non-empty secret has been set, the cookie will be signed.
- **unsign** *Boolean*: Unsign the request cookies automatically if a secret key is given. You can manually unsign the cookie by invoking `request.unsign()` if this option is set to `false`. Default is `false`.
- **parseOptions** *Object*: The options for [cookie.parse()](https://github.com/jshttp/cookie#cookieparsestr-options).
- **decorator** *Object*: Customize the decorator names. Default is:
```js
{
  reqGetCookie: 'cookies',
  unsignCookie: 'unsign',
  resSetCookie: 'cookie',
  resSetCookies: 'cookies'
}
```

For more options, please check [cookie](https://github.com/jshttp/cookie#options-1).

Some has default values:

- **httpOnly**: true

## Api

- **request.cookies**: The parsed request cookies.
- **request.unsign(key: String, secret?: String)**: Unsign the given cookie pair. The secret passed here will override the plugin secret.
- **request.cookie(key: String, value: String, options?: Object)**: Set a single cookie pair. The options passed here will override the plugin options.
- **request.cookies(cookies: Object, options?: Object)**: Set a set of cookie pairs. The options passed here will override the plugin options.

## License

[MIT](./LICENSE)
