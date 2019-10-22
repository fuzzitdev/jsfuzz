const qs = require('qs');
const assert = require('assert');

function isASCII(str) {
    return /^[ -~]+$/.test(str);
}

function fuzz(buf) {
    const str = buf.toString();
    if (!isASCII(str)) {
        return
    }
    const obj = qs.parse(str);
    const str1 = qs.stringify(obj);
    const obj1 = qs.parse(str1);
    assert.deepEqual(obj, obj1);
}

module.exports = {
    fuzz
};
