const xml2js = require('xml2js')

async function fuzz (bytes) {
  const string = String.fromCodePoint(...bytes)
  try {
    await xml2js.parseStringPromise(string)
  } catch (error) {
    if (!acceptable(error)) throw error
  }
}

function acceptable (error) {
  return !!expected
    .find(message => error.message.startsWith(message))
}

const expected = [
  'Non-whitespace before first tag',
  'Unencoded',
  'Unexpected end',
  'Invalid character',
  'Invalid attribute name',
  'Invalid tagname',
  'Unclosed root tag',
  'Attribute without value',
  'Forward-slash in opening tag',
  'Text data outside of root node',
  'Unquoted attribute value',
  'Unmatched closing tag',
  'No whitespace between attributes',
  'Unexpected close tag'
]

exports.fuzz = fuzz
