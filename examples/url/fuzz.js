const url = require('url')

async function fuzz (bytes) {
  const string = String.fromCodePoint(...bytes)
  try {
    whatwg(string)
    params(string)
    legacy(string)
  } catch (error) {
    if (!acceptable(error)) throw error
  }
}

function whatwg (string) {
  const parsed = new url.URL(string)
  parsed.toString()
  parsed.toJSON()
}

function params (string) {
  const parsed = new url.URLSearchParams(string)
  parsed.toString()
}

function legacy (string) {
  /* eslint-disable-next-line node/no-deprecated-api */
  const parsed = url.parse(string)
  url.format(parsed)
}

function acceptable (error) {
  return (
    error instanceof URIError ||
    expected.code.includes(error.code)
  )
}

const expected = {
  code: [
    'ERR_INVALID_URL'
  ]
}

exports.fuzz = fuzz
