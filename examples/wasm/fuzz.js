const wast = require("@webassemblyjs/wast-parser");

const decoderOpts = {};

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

function fuzz(buf) {
    try {
        const str = buf.toString();
        if (isASCII(str)) {
            const ast = wast.parse(str);
        }
    } catch (e) {
        // Those are "valid" exceptions.
        if (e.message === 'magic header not detected' ||
            e.message === 'unexpected end' ||
            e.message.indexOf('Unexpected character') !== -1 ||
            e.message.indexOf('Invalid array length') !== -1 ||
            e.message.indexOf('Unknown token') !== -1) {
        } else {
            throw e;
        }
    }
}

module.exports = {
    fuzz
};