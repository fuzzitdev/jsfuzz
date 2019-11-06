const parse = require('csv-parse/lib/sync');

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

function fuzz(buf) {
    const str = buf.toString();
    if (!isASCII(str)) {
        return
    }
    try {
        parse(str);
    } catch (e) {
        // Those are "valid" exceptions. we can't catch them in one line as
        // jpeg-js doesn't export/inherit from one exception class/style.
        if (e.message.indexOf('Quote') !== -1 ||
            e.message.indexOf('Invalid Record Length') !== -1) {
        } else {
            throw e;
        }
    }
}

module.exports = {
    fuzz
};