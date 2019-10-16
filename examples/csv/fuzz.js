const parse = require('csv-parse/lib/sync');

function fuzz(buf) {
    try {
        parse(buf.toString());
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