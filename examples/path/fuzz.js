const path = require('path')

async function fuzz (bytes) {
  const string = String.fromCodePoint(...bytes)
  try {
    path.basename(string)
    path.dirname(string)
    path.extname(string)
    path.isAbsolute(string)
    path.join(string)
    path.normalize(string)
    path.parse(string)
    path.resolve(string)
    path.toNamespacedPath(string)
  } catch (error) {
    if (!acceptable(error)) throw error
  }
}

function acceptable (error) {
  return !!expected
    .find(message => error.message.startsWith(message))
}

const expected = [
  
]

exports.fuzz = fuzz
