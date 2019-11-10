const pako = require('pako')

async function fuzz (bytes) {
  try {
    pako.deflate(bytes)
    pako.inflate(bytes)
  } catch (error) {
    if (!acceptable(error)) throw error
  }
}

function acceptable (error) {
  return (
    typeof error === 'string' &&
    !!expected.find(message => error.startsWith(message))
  )
}

const expected = [
  'buffer error',
  'incorrect header check',
  'unknown compression method',
  'invalid window size',
  'invalid distance',
  'invalid block type',
  'invalid code lengths',
  'too many length or distance symbols',
  'invalid stored block lengths',
  'need dictionary',
  'incorrect data check',
  'invalid literal/length code',
  'invalid bit length repeat',
  'invalid code',
  'invalid literal'
];

exports.fuzz = fuzz;
