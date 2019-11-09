const path = require('path')

async function fuzz (bytes) {
  const string = String.fromCodePoint(...bytes)
  path.basename(string)
  path.dirname(string)
  path.extname(string)
  path.isAbsolute(string)
  path.join(string)
  path.normalize(string)
  path.parse(string)
  path.resolve(string)
  path.toNamespacedPath(string)
}

exports.fuzz = fuzz
