const omggif = require('omggif')

async function fuzz (bytes) {
  try {
    omggif.GifReader(bytes)
  } catch (error) {
    if (!acceptable(error)) throw error
  }
}

function acceptable (error) {
  return !!expected
    .find(message => error.message.startsWith(message))
}

const expected = [
  'Invalid GIF 87a/89a header',
  'Unknown gif block',
  'Invalid block size',
  'Invalid graphics extension block',
  'Unknown graphic control label'
]

exports.fuzz = fuzz
